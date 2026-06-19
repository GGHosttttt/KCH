You are an expert Senior UI/UX Designer and Frontend Developer specializing in Medical and IoT Kiosk Interfaces. Your task is to design and build a clean, highly accessible, and modern Touchscreen User Interface for the "Khmer Community Health Kiosk (KCH-Kiosk)" project deployed in rural Cambodia.

[GLOBAL UI/UX SPECIFICATIONS]
- Screen Target: 7-inch to 10-inch Touchscreen Display (Landscape, 16:9 aspect ratio).
- Color Palette: Medical Trust theme. Dominant Primary Green/Teal (#1a5c6e or #0d9488) symbolizing health and trust, Secondary Blue/Gray for backgrounds, Alert Gold/Red for warning metrics, and Clean White (#FFFFFF) for active cards.
- Typography: Use 'Khmer OS Battambang' for body text and 'Khmer OS Muol Light' or bold weights for major headings. Ensure the text size is large, readable, and highly optimized for elderly villagers and users with low literacy or weak eyesight.
- Interaction: Button targets must be large, finger-friendly cards with subtle hover/active micro-interactions and high contrast.
- Language: The primary language displayed must be Cambodian (Khmer Script) alongside English subtitles.

Design a complete 5-Step multi-page/tab flow system layout consisting of the following specific pages:

1. WELCOME SCREEN (ទំព័រស្វាគមន៍)
- Background: Professional abstract patterns with subtle medical iconography.
- Header: Official Ministry of Education, Youth and Sport (MoEYS) style layout or KCH logo.
- Main Centerpiece: Large heading text "សូមស្វាគមន៍មកកាន់ ទូរសុខភាពសហគមន៍ខ្មែរ" (Welcome to Khmer Community Health Kiosk).
- Subtitle: "ប្រព័ន្ធស្វ័យសេវាពិនិត្យសុខភាពបឋម (វាស់កម្ពស់ ទម្ងន់ សម្ពាធឈាម និងកម្រិតជាតិស្ករមិនចាក់ម្ជុល)"
- Call to Action: A massive, centered, blinking pulse button "ចាប់ផ្តើមពិនិត្យសុខភាព" (Start Health Check) with a large play/right arrow icon.

2. AUTHENTICATION PAGE (ទំព័រផ្ទៀងផ្ទាត់គណនី)
- Title: "សូមបញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីបន្ត" (Please enter your details to proceed).
- Grid Layout: Split screen layout.
  - Left Side: A clean numeric keypad interface for entering phone numbers with an input field labeled "លេខទូរស័ព្ទដៃ (Phone Number)" supporting placeholder "ឧទាហរណ៍៖ 012345678". Below it, dynamic Khmer text buttons for "បញ្ជាក់ (Confirm)" in dark green and "លុប (Clear)" in dark gray.
  - Right Side: A prominent visual card saying "ឬ ស្កេនកូដ QR ដើម្បីចូលប្រើប្រាស់" with an animated scanner bounding-box overlay around a dummy QR Code placeholder.

3. INTERACTIVE INSTRUCTION GUIDE (ទំព័រណែនាំជំហាននៃការវាស់)
- Title: "ការណែនាំអំពីរបៀបវាស់វែងសុខភាព" (Instructions for Health Measurements).
- Three Columns Layout showing concurrent or sequential interactive task cards:
  - Card A (Height & Weight): An icon illustration of a person standing straight under an ultrasonic sensor and on a platform load cell. Text: "១. ឈរត្រង់លើជើងទម្រដើម្បីវាស់កម្ពស់ និងទម្ងន់"
  - Card B (Blood Pressure Cuff): An icon illustration of an arm inserted inside a pneumatic automated blood pressure monitor cuff. Text: "២. លូកដៃចូលឧបករណ៍វាស់សម្ពាធឈាម ហើយអង្គុយស្ងៀម"
  - Card C (Non-invasive Glucose Finger Sensor): An icon illustration of an index finger placed gently onto a glowing optical spectroscopy sensor lens. Text: "៣. ដាក់ចុងម្រាមដៃលើឧបករណ៍វាស់ជាតិស្ករ (មិនចាក់ម្ជុល)"
- Footer Indicator: A small blinking icon "កំពុងដំណើរការអានទិន្នន័យពីសេនស័រ..." with a soft green status indicator ring representing real-time ESP32/Raspberry Pi telemetry collection.

4. PROCESSING SCREEN (ទំព័ររង់ចាំការវិភាគពី AI)
- Design: Clean, distraction-free loader display.
- Heading: "ប្រព័ន្ធ AI កំពុងធ្វើការវិភាគទិន្នន័យសុខភាពរបស់អ្នក..." (AI System Analyzing Your Health Metrics).
- Centerpiece: A gorgeous, smooth multi-wavelength light wave animation (simulating Spectroscopy/PPG wave signal filtration patterns) inside a dynamic circular progress ring showing percentage countdown.
- Note: Subtext saying "សូមរក្សាចិត្តឱ្យស្ងប់ អង្គុយត្រង់ និងកុំទាន់ដកម្រាមដៃចេញ" (Please relax, sit straight, and do not remove your finger yet).

5. HEALTH RESULT DASHBOARD (ផ្ទាំងបង្ហាញលទ្ធផលសុខភាពចុងក្រោយ)
- Title Header: "លទ្ធផលការពិនិត្យសុខភាពរបស់អ្នក (Your Health Evaluation)" with User ID/Phone Metadata.
- Grid Layout (4-Card Dashboard Metrics Grid):
  - Card 1 (Body Composition): Displaying "កម្ពស់ (Height): 165 cm", "ទម្ងន់ (Weight): 62 kg", and "សន្ទស្សន៍ BMI: 22.8" marked under a green colored "ធម្មតា (Normal)" badge.
  - Card 2 (Blood Pressure): Displaying "សម្ពាធឈាម (Blood Pressure): 125/80 mmHg" and "ចង្វាក់បេះដូង (Pulse): 76 bpm". Status tag: Soft amber "ប្រឈមហានិភ័យដំបូង (Pre-hypertensive)".
  - Card 3 (Non-invasive Glucose): Displaying AI predicted categorization. Title: "កម្រិតជាតិស្ករបឋម (AI Predicted Glucose Group)". Status Tag: Clean White/Green bold status box saying "សុខភាពធម្មតា (Normal Range / Non-diabetic)".
  - Card 4 (Action Control): Two prominent primary buttons positioned horizontally at the bottom:
    - Button A: "បោះពុម្ពវិក្កយបត្រលទ្ធផល" (Print Receipt) styled with a printer/paper icon in bright teal.
    - Button B: "បញ្ចប់ការងារ (Exit/Finish)" styled in bold dark gray.

Generate code using React/Next.js and Tailwind CSS that dynamically simulates switching between these pages nicely with standard clean responsive UI styling.