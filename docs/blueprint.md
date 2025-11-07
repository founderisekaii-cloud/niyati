# **App Name**: NiyatiVerse

## Core Features:

- Chapter Display: Display chapters in a smooth-scroll reading view, supporting both PDF and text formats.
- Content Encryption & Watermarking: Dynamically watermark downloaded PDFs with user-specific details and encrypt them using AES-GCM.
- Payment Gateway Integration: Integrate Razorpay for automated payments, falling back to manual UPI payments with QR code generation if Razorpay keys are absent.
- UPI Payment Auto-Approval (OCR): Automatically approve UPI payments by parsing uploaded screenshots or txn-IDs using OCR (Tesseract.js) and verifying the amount and reference.
- Admin Dashboard: Provide an admin dashboard to upload chapters, set release dates/prices, toggle payment modes, and manage orders.
- Push Notifications: Implement web-push notifications for admin alerts on new payments and user notifications for chapter releases.
- Google Drive Integration: Allow storing PDFs and assets in Google Drive using the Drive API (if credentials are provided) or using Drive share links (if not).

## Style Guidelines:

- Primary color: Gold (#FFD700) to reflect the universe's theme, suggesting richness and value.
- Background color: Very dark desaturated blue (#1A1A2E) to set a cosmic scene and high readability.
- Accent color: Desaturated gold (#B8860B) to accent key UI elements.
- Body font: 'Inter', a sans-serif font that is modern, clean and neutral.
- Headline font: 'Alegreya', a serif font with a intellectual and contemporary feel.
- Use minimalist icons with gold accents to maintain a cosmic dark theme.
- Employ a responsive, cinematic layout with smooth transitions suitable for both desktop and mobile readers.
- Subtle particle animations in the background to enhance the cosmic atmosphere.