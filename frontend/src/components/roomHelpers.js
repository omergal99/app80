const roomNamesByIndex = [
  'חדר הסודות',
  "חדר חדרי החדרים",
  "חדר ילדים",
  "חדר אחרון ודי",
  "חדר מוסטפה קולומבוס",
]

const getRoomNamesByIndex = (index) => {
  return roomNamesByIndex[index] || `חדר ${index + 1}`;
}

export { getRoomNamesByIndex };