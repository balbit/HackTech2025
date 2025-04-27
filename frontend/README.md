# TeleHealth Frontend

A telemedicine application designed for low-bandwidth areas with advanced AI features for 3D wound modeling.

## Features

- Landing page with options for doctor and patient interfaces
- Mobile-optimized patient interface
- Desktop-optimized doctor interface
- Real-time chat functionality via websockets
- Image upload for 3D model generation
- 3D model viewing using USDZ format (placeholder)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables (create a `.env.local` file)
```
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url.com
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Deployment with ngrok

To expose your local development server via ngrok:

1. Install ngrok
```bash
npm install -g ngrok
# or
yarn global add ngrok
```

2. Run the development server
```bash
npm run dev
# or
yarn dev
```

3. In a separate terminal, run ngrok
```bash
ngrok http 3000
```

4. Use the generated ngrok URL to access your application from any device

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and shared code
- `public/` - Static assets

## Backend Integration

This frontend is designed to work with a backend that provides:

1. WebSocket endpoints for real-time communication
2. API for creating 3D models from uploaded images
3. API for retrieving generated 3D models

Currently, the frontend uses mock implementations for these features, with placeholders for the actual backend integration.

## Technologies Used

- Next.js - React framework
- TypeScript - Static typing
- Tailwind CSS - Styling
- Socket.io - WebSocket communication
- Zustand - State management

## License

This project is licensed under the MIT License - see the LICENSE file for details.
