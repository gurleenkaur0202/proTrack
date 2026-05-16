# ProTrack Workshop

A modern, streamlined collaborative workspace for managing projects, teams, and tasks. ProTrack Workshop focuses on simplicity and speed, allowing users to jump straight into collaboration.

## 🚀 Features

- **Dynamic Dashboard**: Real-time KPI tracking for Total Tasks, Pending, In Progress, and Completed items.
- **Task Management**: Full Kanban-style board with status updates and filtering.
- **Projects & Teams**: Create dedicated projects and organize members into specialized teams.
- **Global Search**: Instantly find any task, project, or team member via the unified search bar in the header.
- **Personalized Profiles**: 
    - Direct device photo upload.
    - Customizable bios.
    - Role-based badges (Admin/Member).
- **Sleek UI/UX**: 
    - Unique right-side navigation layout.
    - Smooth motion transitions and staggered animations.
    - Fully responsive design using Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS (Utility-first styling).
- **Animations**: Motion (formerly Framer Motion).
- **Icons**: Lucide React.
- **Backend**: Express.js (Node.js).
- **Storage**: Local persistent JSON storage system.

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/proTrack.git
   cd proTrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## 📂 Project Structure

- `/src/components`: UI components (Dashboard, TaskBoard, etc.).
- `/src/contexts`: Authentication and global state management.
- `/src/services`: API client services for data persistence.
- `/server.ts`: Express backend handling data CRUD operations.
- `/storage.json`: Local database file (auto-generated).

## 📝 License

This project is licensed under the MIT License.
