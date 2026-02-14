# משחק התנחש 80% - Figma Design Specification

## Project Overview
A multiplayer number guessing game application where players select numbers 0-100, and the winner is determined by who is closest to 80% of the average of all numbers.

**Language:** Hebrew (RTL)  
**Primary Audience:** Multiplayer game enthusiasts  
**Tech Stack:** React + Tailwind CSS + shadcn/ui

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#3B82F6` | Buttons, highlights, active states |
| **Primary Blue Light** | `#DBEAFE` | Backgrounds, hover states |
| **Primary Blue Dark** | `#1E3A8A` | Text on light backgrounds |
| **Success Green** | `#10B981` | Check marks, positive feedback |
| **Error Red** | `#EF4444` | Error states, validation |
| **Gray 50** | `#F9FAFB` | Light backgrounds |
| **Gray 100** | `#F3F4F6` | Subtle backgrounds |
| **Gray 200** | `#E5E7EB` | Borders, dividers |
| **Gray 500** | `#6B7280` | Secondary text |
| **Gray 600** | `#4B5563` | Primary text |
| **Yellow 500** | `#EAB308` | Icons, badges |
| **White** | `#FFFFFF` | Card backgrounds, primary backgrounds |

### Typography

| Element | Font Family | Size | Weight | Line Height | Usage |
|---------|------------|------|--------|-------------|-------|
| **Page Title** | Space Grotesk | 48-64px | Bold (700) | 1.2 | Main heading (משחק התנחש 80%) |
| **Subtitle** | System | 20px | Regular (400) | 1.5 | Game description text |
| **Card Title** | System | 18px | Semibold (600) | 1.5 | Section headers |
| **Card Description** | System | 14px | Regular (400) | 1.5 | Descriptive text |
| **Body Text** | System | 14px | Regular (400) | 1.5 | Regular content |
| **Badge Text** | System | 12px | Regular (400) | 1.4 | Badge labels |
| **Monospace** | Courier New | 48px | Bold (900) | 1.2 | Large number display |

### Spacing (8px base unit)
- `xs`: 4px (0.5 unit)
- `sm`: 8px (1 unit)
- `md`: 16px (2 units)
- `lg`: 24px (3 units)
- `xl`: 32px (4 units)
- `2xl`: 48px (6 units)

### Border Radius
- `sm`: 4px
- `md`: 8px
- `lg`: 12px

### Shadows
- **sm**: 0 1px 2px rgba(0,0,0,0.05)
- **md**: 0 4px 6px rgba(0,0,0,0.1)
- **lg**: 0 10px 15px rgba(0,0,0,0.1)

---

## Screens & Components

### Screen 1: Room Selection

**Layout:** Full-page, centered column layout

#### Header Section
- **Title:** "משחק התנחש 80%" (Space Grotesk, 48-64px, Bold)
- **Subtitle 1:** "בחר מספר בין 0 ל-100." (20px, Gray-600)
- **Subtitle 2:** "המנצח הוא מי שהכי קרוב לממוצע של סכום המספרים כפול 0.8" (20px, Gray-600)
- **Spacing:** 24px below header section

#### Player Nickname Input Card
- **Card Background:** White/80% with backdrop blur
- **Card Padding:** 16px (header), 12px (content)
- **Title:** "בחר כינוי להצגה במשחק"

**Components Inside:**
1. **Nickname Input**
   - Type: Text input
   - Placeholder: "הכינוי שלך..."
   - Direction: Right-to-left (dir="rtl")
   - Height: 48px
   - Font Size: 18px
   - Max Length: 20 characters
   - Border: 1px gray-200, or 2px red-500 on error (invalid state)
   - Border Radius: 8px

2. **Clear Player Data Button**
   - Variant: Outline
   - Text: "מחק נתוני שחקן"
   - Disabled when nickname is empty
   - Height: 48px

**Spacing:** 12px gap between input and button

#### Room Cards Grid
- **Grid Layout:** 1 column on mobile (≤768px), 2 columns on desktop
- **Gap:** 24px
- **Max Width:** 1280px (80rem)
- **Container Padding:** 16px

**Room Card Component**
- **Background:** White/80% with backdrop blur
- **Border:** 1px gray-200
- **Padding:** 16px
- **Border Radius:** 8px
- **Hover State:** Add shadow-lg, transition 300ms
- **Height:** Auto

**Room Card Content:**

1. **Room Header**
   - Layout: Flex between
   - **Room Name:** 18px semibold font
   - **Status Badge:** 
     - Text color: white
     - Background: Conditional based on game_status
       - "waiting" → Blue (#3B82F6)
       - "choosing" → Amber/Orange
       - "results" → Gray
     - Padding: 4px 12px
     - Border Radius: 4px
     - Font Size: 12px

2. **Room Details**
   - **Player Count:** "משחקים: X" (Gray-600, 14px)
   - **Current Round:** "סיבוב נוכחי: X" (Gray-600, 14px)
   - Spacing: 6px vertical

3. **Action Buttons** (Two columns)
   - **Join as Player Button**
     - Primary blue button
     - Text: "הצטרף כשחקן"
     - Full width
   - **Join as Viewer Button**
     - Outline button
     - Text: "צפוי"
     - Full width
   - Gap: 8px

---

### Screen 2: Game Room (Playing)

**Layout:** Two-column layout on desktop, stacked on mobile
- **Left Column:** Game selector + hidden/collapsible panels (50-60% width)
- **Right Column:** Players list + game history (40-50% width)

#### Header
- **Layout:** Flex between
- **Left Side:** "חדר: {roomName}" (Title style)
- **Right Side:** 
  - Multiplier Input (if admin)
  - "Leave Room" button (outline style)
- **Height:** 60px
- **Padding:** 16px
- **Border-bottom:** 1px gray-200
- **Background:** White/80%

#### Left Column: Number Selection Component

**Card Layout:**
- **Background:** White/80%
- **Padding:** 24px
- **Border Radius:** 8px
- **Spacing Between Elements:** 16px

**Hide Controls (Top)**
- Layout: Flex row, wrap on mobile
- Gap: 8px

**Button 1: Hide/Show Number**
- Variant: Toggle (outline when inactive, default when active)
- Icon: Eye/EyeOff from lucide-react
- Text: "חשיפה גדולה" or "ללא חשיפה"
- Size: Small (sm)

**Button 2: Hide After Choosing**
- Variant: Toggle
- Icon: Circle (○) or Checkmark (✓)
- Text: "הסתר לאחר בחירה"
- Size: Small (sm)

**Large Number Display**
- **Background:** Transparent (in card)
- **Font:** Courier New, 48px, bold
- **Text Color:** Gray-900
- **Text Align:** Center
- **Height:** 96px
- **Display:** "****" if hidden, else number value
- **Container Width:** 192px (fixed)
- **Vertical Align:** Center

**Slider Section**
- **Hidden when:** hideNumberAfterChoosing && hasChosen
- **Slider Component:**
  - Range: 0-100
  - Step: 1
  - Disabled: When hasChosen = true
  - Color: Blue primary
  - Height: 6px
  - Margin Bottom: 16px

**Number Labels Under Slider:**
- Layout: Flex between
- Spacing: Full width of slider
- Text: "100", "50", "0"
- Font Size: 12px
- Color: Gray-500
- Margin: 24px bottom

**Number Input Section**
- **Background:** Gray-50
- **Padding:** 16px
- **Border Radius:** 8px
- **Layout:** Left-to-right (RTL flex)
- **Gap:** 12px

**Input Field:**
- **Type:** Text/Number
- **Placeholder:** "הזן מספר בין 0-100"
- **Direction:** RTL
- **Size:** Flexible width
- **Height:** 40px
- **Border:** 1px gray-300
- **Max Length:** Validates 0-100

**Input Submit Button:**
- Text: "בחר" (Submit/Choose)
- Disabled: When hasChosen = true
- Variant: Default (blue)
- Height: 40px

**Optional Footer (When Chosen):**
- Text: "בחירה נשמרה ✓"
- Color: Green-500
- Font: 14px, center aligned

---

#### Right Column: Players List Panel

**Card Layout:**
- **Background:** White/80%
- **Border:** 1px gray-200
- **Border Radius:** 8px
- **Overflow:** Hidden

**Header (Clickable to Expand/Collapse)**
- **Layout:** Flex between
- **Left:** 
  - Icon: Users (from lucide-react)
  - Text: "שחקנים ({count})"
  - Font: 16px semibold
- **Right:** 
  - Icon: ChevronUp/ChevronDown (based on expanded state)
- **Cursor:** Pointer
- **Padding:** 16px
- **Border-bottom:** 1px gray-200

**Player List Content (When Expanded)**
- **Layout:** Stacked cards
- **Padding:** 16px
- **Gap:** 12px

**Individual Player Item:**
- **Layout:** Flex between
- **Left Side:**
  - **Crown Icon:** (if is_admin) Yellow, 16px
  - **Player Name:** 14px semibold
  - **Badge (if current player):** "אתה" (Your indicator)
    - Background: Blue-600
    - Color: White
    - Font: 12px
    - Padding: 4px 8px
    - Border Radius: 4px
- **Right Side:**
  - **Status Icon** (only in "choosing" game_status):
    - CheckCircle2 (Green) if has_chosen = true
    - Circle (Gray-300) if has_chosen = false
- **Background (for current player):** Blue-100
- **Border (for current player):** 2px blue-300
- **Background (other players):** Gray-50
- **Padding:** 12px
- **Border Radius:** 8px

**Show More Players Link (if needed)**
- Text: "הצג הכל"
- Color: Blue-600
- Font Size: 14px
- Padding: 8px 0

---

#### Right Column: Game History Panel

**Layout:** Below Players List

**Card Layout:**
- **Background:** White/80%
- **Border:** 1px gray-200
- **Border Radius:** 8px
- **Margin Top:** 16px

**Header (Clickable to Expand/Collapse)**
- **Layout:** Flex between
- **Left:** 
  - Icon: Trophy or History icon
  - Text: "היסטוריית משחקים"
- **Right:** 
  - Icon: ChevronUp/ChevronDown
- **Cursor:** Pointer
- **Padding:** 16px
- **Border-bottom:** 1px gray-200

**History Items (When Expanded)**
- **Padding:** 16px
- **Gap:** 8px

**Individual History Item:**
- **Layout:** Card style, clickable
- **Content:**
  - "סיבוב {number}" (bold, 14px)
  - "זוכה: {winnerName}" (Gray-600, 12px)
  - "מספרו של הזוכה: {number}" (Gray-600, 12px)
- **Background:** Gray-50
- **Hover:** Slightly darker or underline
- **Padding:** 8px
- **Border Radius:** 4px
- **Cursor:** Pointer

**Show More History Link (if needed)**
- Text: "הצג הכל ({total})"
- Color: Blue-600
- Font Size: 12px

---

### Screen 3: Game Room (Results View)

**Modal Overlay:**
- **Background:** Black with 50% opacity
- **Z-Index:** 50
- **Display:** Fixed, full screen
- **Flex:** Center items and justify

**Modal Card:**
- **Background:** White
- **Max Width:** 640px (md)
- **Max Height:** 90vh
- **Overflow:** Y-auto
- **Border Radius:** 8px
- **Padding:** 24px
- **Box Shadow:** lg

**Modal Header:**
- **Layout:** Flex between
- **Left:**
  - Icon: Trophy (Yellow-500, 24px)
  - Title: "תוצאות סיבוב {number}"
  - Font: 18px semibold
- **Right:**
  - Close Button (×)
  - Variant: Outline
  - Size: 8x8 (32px height/width)

**Modal Content:**

**Results Display Section:**
- Spacing: 24px between sections

**Section 1: Winner Display**
- **Layout:** Center
- **Winner Name:** Large, 20px, bold, blue
- **Winner Number:** 16px, gray
- **Crown Icon:** Next to winner name, yellow

**Section 2: Game Statistics**
- **Average Number:** Value with label
- **Calculation:** "80% from average = {value}"
- **Multiplier:** "{multiplier}" (editable if admin)

**Section 3: Rankings Table**
- **Columns:**
  1. Rank (1, 2, 3...)
  2. Player Name
  3. Selected Number
  4. Distance (how close to winning number)
- **Layout:** Grid or table format
- **Alternating Row Colors:** Every other row gray-50
- **Padding:** 8px per cell
- **Winner Row:** Blue background highlight

---

## Component Specifications

### Buttons

**Default Button (Primary)**
- **Background:** Blue-600
- **Text Color:** White
- **Padding:** 8px 16px
- **Border:** None
- **Border Radius:** 6px
- **Font Weight:** 500
- **Hover:** Blue-700,shadow-md
- **Disabled:** Gray-400, cursor not-allowed
- **Transition:** 150ms

**Outline Button (Secondary)**
- **Background:** White
- **Border:** 1px gray-200
- **Text Color:** Gray-900
- **Padding:** 8px 16px
- **Border Radius:** 6px
- **Hover:** Gray-100, shadow-sm
- **Disabled:** Gray-100, color gray-400

**Button Sizes:**
- **sm:** 8px 12px, font 12px
- **md:** 10px 16px, font 14px
- **lg:** 12px 24px, font 16px

### Input Fields

**Base Input:**
- **Border:** 1px gray-300
- **Border Radius:** 6px
- **Padding:** 8px 12px
- **Font Size:** 14px
- **Focus:** outline-none, border-blue-500, shadow blue-200/50
- **Placeholder Color:** Gray-400
- **Direction (Arabic):** RTL

**Error State:**
- **Border:** 2px red-500
- **Background:** Red-50

### Cards

**Standard Card:**
- **Background:** White or White/80% with backdrop blur
- **Border:** 1px gray-200
- **Border Radius:** 8px
- **Padding:** 16px
- **Shadow:** sm

**Card Header:**
- **Padding:** 16px
- **Border Bottom:** 1px gray-200

**Card Content:**
- **Padding:** 16px

### Badges

**Default Badge:**
- **Background:** Blue-600
- **Text Color:** White
- **Padding:** 4px 8px
- **Border Radius:** 4px
- **Font Size:** 12px
- **Font Weight:** 500

**Status Badge Variants:**
- **Waiting:** Blue background
- **Choosing:** Orange/Amber background
- **Results:** Gray background

---

## Responsive Design Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|-----------------|
| **Mobile** | < 640px | Single column, full width cards, stacked buttons |
| **Tablet** | 640-1024px | Two columns with wrapping, adjusted spacing |
| **Desktop** | > 1024px | Full two-column layout, optimal spacing |

---

## Interaction & Animation

### Transitions
- **Default Duration:** 300ms (ease-in-out)
- **Button Hover:** 150ms (ease-out)
- **Collapse/Expand:** 200ms (ease-in-out)

### State Indicators
- **Chosen State:** Lock slider, disable input, show checkmark
- **Hide Number:** Display "****" instead of actual value
- **Player Highlight:** Blue background + border for current player
- **Loading State:** Opacity reduced, cursor wait

### Hover States
- **Cards:** Add shadow, translate up 2px
- **Buttons:** Darken background, add shadow
- **Links:** Underline, color blue

---

## Design Tokens Export (for Tailwind)

```javascript
// tailwind.config.js reference
module.exports = {
  theme: {
    colors: {
      primary: '#3B82F6',
      'primary-light': '#DBEAFE',
      'primary-dark': '#1E3A8A',
      success: '#10B981',
      error: '#EF4444',
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        500: '#6B7280',
        600: '#4B5563',
        900: '#111827',
      },
    },
    fontFamily: {
      display: "'Space Grotesk', sans-serif",
      mono: "'Courier New', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '48px',
      '5xl': '64px',
    },
    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
    },
  },
};
```

---

## Accessibility Guidelines

1. **Color Contrast:** All text meets WCAG AA standards (4.5:1 for normal text)
2. **Focus States:** Visible focus indicator on all interactive elements
3. **Icons:** Always paired with text labels
4. **Direction:** Proper RTL support for Hebrew content
5. **Screen Readers:** Semantic HTML, proper ARIA labels
6. **Keyboard Navigation:** All interactive elements keyboard accessible

---

## Notes for Implementation

- **RTL Layout:** All screens use right-to-left (RTL) layout for Hebrew
- **Backdrop Blur:** Cards use `backdrop-blur-sm` for modern glass-morphism effect
- **Responsive Images:** Ensure UI adapts gracefully to mobile screens
- **Performance:** Use CSS optimization and lazy loading where applicable
- **Localization:** Game description text uses Hebrew; ensure proper text alignment and spacing
- **Dark Mode:** Consider adding dark mode variant of this design (future enhancement)

---

## Components Library Integration

This design uses **shadcn/ui** components:
- Button
- Input
- Card (CardHeader, CardContent, CardTitle, CardDescription)
- Badge
- Slider
- Icons (lucide-react)

All components follow the design system specifications defined above.

---

## Export & Handoff

**For Figma Design File Creation:**
1. Create artboards for each screen with specified dimensions
2. Use component library for reusable elements
3. Apply design tokens as styles
4. Create variants for different states (hover, active, disabled, error)
5. Document component properties and constraints
6. Add interaction overlays and prototyping links

**For Developer Handoff:**
This specification is implementation-ready and maps directly to Tailwind CSS and shadcn/ui.
