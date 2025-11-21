import requests
import websocket
import json
import threading
import time
import sys
from datetime import datetime

class GameAPITester:
    def __init__(self, base_url="https://target-number.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.ws_url = base_url.replace('https://', 'wss://').replace('http://', 'ws://')
        self.tests_run = 0
        self.tests_passed = 0
        self.ws_connections = {}
        self.ws_messages = {}

    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
            else:
                print(f"❌ Failed - {name}")
            return success
        except Exception as e:
            print(f"❌ Failed - {name}: {str(e)}")
            return False

    def test_rooms_api(self):
        """Test GET /api/rooms endpoint"""
        try:
            response = requests.get(f"{self.api_url}/rooms", timeout=10)
            
            if response.status_code != 200:
                print(f"Expected 200, got {response.status_code}")
                return False
            
            rooms = response.json()
            
            # Should have 4 rooms
            if len(rooms) != 4:
                print(f"Expected 4 rooms, got {len(rooms)}")
                return False
            
            # Check room structure
            for room in rooms:
                required_fields = ['room_id', 'player_count', 'game_status', 'players']
                for field in required_fields:
                    if field not in room:
                        print(f"Missing field {field} in room data")
                        return False
                
                # Room IDs should be 1-4
                if room['room_id'] not in [1, 2, 3, 4]:
                    print(f"Invalid room_id: {room['room_id']}")
                    return False
                
                # Initial status should be waiting
                if room['game_status'] not in ['waiting', 'choosing', 'results']:
                    print(f"Invalid game_status: {room['game_status']}")
                    return False
            
            print(f"Found {len(rooms)} rooms with correct structure")
            return True
            
        except Exception as e:
            print(f"Error testing rooms API: {e}")
            return False

    def test_websocket_connection(self):
        """Test WebSocket connection"""
        try:
            room_id = 1
            nickname = f"test_user_{int(time.time())}"
            ws_url = f"{self.ws_url}/api/ws/{room_id}/{nickname}"
            
            print(f"Connecting to: {ws_url}")
            
            # Create WebSocket connection
            ws = websocket.create_connection(ws_url, timeout=10)
            
            # Wait for initial message
            message = ws.recv()
            data = json.loads(message)
            
            if data.get('type') != 'room_state':
                print(f"Expected room_state, got {data.get('type')}")
                ws.close()
                return False
            
            # Check room state structure
            required_fields = ['room_id', 'players', 'game_status', 'current_round', 'game_history']
            for field in required_fields:
                if field not in data:
                    print(f"Missing field {field} in room state")
                    ws.close()
                    return False
            
            # Player should be added
            player_found = False
            for player in data['players']:
                if player['nickname'] == nickname:
                    player_found = True
                    if not player['is_admin']:  # Should be admin as first player
                        print("First player should be admin")
                        ws.close()
                        return False
                    break
            
            if not player_found:
                print("Player not found in room state")
                ws.close()
                return False
            
            ws.close()
            print(f"WebSocket connection successful, player {nickname} added as admin")
            return True
            
        except Exception as e:
            print(f"WebSocket connection failed: {e}")
            return False

    def test_game_flow(self):
        """Test complete game flow with 2 players"""
        try:
            room_id = 2
            player1 = f"admin_{int(time.time())}"
            player2 = f"player_{int(time.time())}"
            
            # Connect both players
            ws1_url = f"{self.ws_url}/api/ws/{room_id}/{player1}"
            ws2_url = f"{self.ws_url}/api/ws/{room_id}/{player2}"
            
            ws1 = websocket.create_connection(ws1_url, timeout=10)
            time.sleep(0.5)  # Small delay
            ws2 = websocket.create_connection(ws2_url, timeout=10)
            
            # Clear initial messages
            ws1.recv()  # room_state for player1
            ws1.recv()  # room_state update when player2 joins
            ws2.recv()  # room_state for player2
            
            # Player1 (admin) starts game
            ws1.send(json.dumps({"action": "start_game"}))
            
            # Both should receive game start
            msg1 = json.loads(ws1.recv())
            msg2 = json.loads(ws2.recv())
            
            print(f"Player1 received: {msg1.get('game_status')}")
            print(f"Player2 received: {msg2.get('game_status')}")
            
            if msg1.get('game_status') != 'choosing' or msg2.get('game_status') != 'choosing':
                print("Game didn't start properly")
                print(f"Expected 'choosing', got: {msg1.get('game_status')}, {msg2.get('game_status')}")
                ws1.close()
                ws2.close()
                return False
            
            # Both players choose numbers
            ws1.send(json.dumps({"action": "choose_number", "number": 30}))
            ws2.send(json.dumps({"action": "choose_number", "number": 70}))
            
            # Wait for results
            time.sleep(2)
            
            # Should receive results
            try:
                # Try to receive multiple messages until we get results
                result1 = None
                result2 = None
                
                for _ in range(3):  # Try up to 3 messages
                    try:
                        msg1 = json.loads(ws1.recv())
                        if msg1.get('game_status') == 'results':
                            result1 = msg1
                            break
                    except:
                        pass
                
                for _ in range(3):  # Try up to 3 messages
                    try:
                        msg2 = json.loads(ws2.recv())
                        if msg2.get('game_status') == 'results':
                            result2 = msg2
                            break
                    except:
                        pass
                
                if not result1 or not result2:
                    print("Results not received properly")
                    ws1.close()
                    ws2.close()
                    return False
                
                # Check if winner calculation is correct
                # Sum = 30 + 70 = 100, Target = 100 * 0.8 = 80
                # Player2 (70) should be closer to 80 than Player1 (30)
                history = result1.get('game_history', [])
                if not history:
                    print("No game history found")
                    ws1.close()
                    ws2.close()
                    return False
                
                latest_round = history[-1]
                if latest_round['target_number'] != 80.0:
                    print(f"Expected target 80.0, got {latest_round['target_number']}")
                    ws1.close()
                    ws2.close()
                    return False
                
                if latest_round['winner'] != player2:
                    print(f"Expected winner {player2}, got {latest_round['winner']}")
                    ws1.close()
                    ws2.close()
                    return False
                
                print(f"Game flow successful: {player1}=30, {player2}=70, target=80, winner={player2}")
                
            except Exception as e:
                print(f"Error receiving results: {e}")
                ws1.close()
                ws2.close()
                return False
            
            ws1.close()
            ws2.close()
            return True
            
        except Exception as e:
            print(f"Game flow test failed: {e}")
            return False

    def test_admin_restrictions(self):
        """Test that only admin can start game and new rounds"""
        try:
            room_id = 3
            admin = f"admin_{int(time.time())}"
            regular = f"regular_{int(time.time())}"
            
            # Connect admin first, then regular player
            ws_admin = websocket.create_connection(f"{self.ws_url}/api/ws/{room_id}/{admin}", timeout=10)
            time.sleep(0.5)
            ws_regular = websocket.create_connection(f"{self.ws_url}/api/ws/{room_id}/{regular}", timeout=10)
            
            # Clear initial messages
            ws_admin.recv()
            ws_admin.recv()
            ws_regular.recv()
            
            # Regular player tries to start game (should fail)
            ws_regular.send(json.dumps({"action": "start_game"}))
            time.sleep(0.5)
            
            # Check that game didn't start
            try:
                # Try to receive message with short timeout
                ws_regular.settimeout(1)
                msg = ws_regular.recv()
                data = json.loads(msg)
                if data.get('game_status') == 'choosing':
                    print("Regular player was able to start game (should not be allowed)")
                    ws_admin.close()
                    ws_regular.close()
                    return False
            except:
                pass  # No message received, which is expected
            
            # Admin starts game (should work)
            ws_admin.send(json.dumps({"action": "start_game"}))
            
            # Both should receive game start
            msg_admin = json.loads(ws_admin.recv())
            msg_regular = json.loads(ws_regular.recv())
            
            if msg_admin.get('game_status') != 'choosing':
                print("Admin couldn't start game")
                ws_admin.close()
                ws_regular.close()
                return False
            
            print("Admin restrictions working correctly")
            ws_admin.close()
            ws_regular.close()
            return True
            
        except Exception as e:
            print(f"Admin restrictions test failed: {e}")
            return False

    def test_join_during_active_game(self):
        """Test that players can't join during active game"""
        try:
            room_id = 4
            admin = f"admin_{int(time.time())}"
            player2 = f"player2_{int(time.time())}"
            late_joiner = f"late_{int(time.time())}"
            
            # Start a game with 2 players
            ws_admin = websocket.create_connection(f"{self.ws_url}/api/ws/{room_id}/{admin}", timeout=10)
            time.sleep(0.5)
            ws_player2 = websocket.create_connection(f"{self.ws_url}/api/ws/{room_id}/{player2}", timeout=10)
            
            # Clear messages and start game
            ws_admin.recv()
            ws_admin.recv()
            ws_player2.recv()
            
            ws_admin.send(json.dumps({"action": "start_game"}))
            
            # Clear game start messages
            ws_admin.recv()
            ws_player2.recv()
            
            # Now try to join with a third player
            try:
                ws_late = websocket.create_connection(f"{self.ws_url}/api/ws/{room_id}/{late_joiner}", timeout=10)
                
                # Should receive error message
                msg = ws_late.recv()
                data = json.loads(msg)
                
                if data.get('type') == 'error':
                    print("Late joiner correctly rejected during active game")
                    ws_admin.close()
                    ws_player2.close()
                    return True
                else:
                    print("Late joiner was allowed to join during active game")
                    ws_admin.close()
                    ws_player2.close()
                    ws_late.close()
                    return False
                    
            except Exception as e:
                print(f"Late joiner connection failed as expected: {e}")
                ws_admin.close()
                ws_player2.close()
                return True
            
        except Exception as e:
            print(f"Join during active game test failed: {e}")
            return False

def main():
    print("🎯 Starting Hebrew Number Game API Tests")
    print("=" * 50)
    
    tester = GameAPITester()
    
    # Run all tests
    tests = [
        ("Rooms API", tester.test_rooms_api),
        ("WebSocket Connection", tester.test_websocket_connection),
        ("Complete Game Flow", tester.test_game_flow),
        ("Admin Restrictions", tester.test_admin_restrictions),
        ("Join During Active Game", tester.test_join_during_active_game),
    ]
    
    for test_name, test_func in tests:
        tester.run_test(test_name, test_func)
        time.sleep(1)  # Small delay between tests
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("❌ Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())