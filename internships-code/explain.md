# Project Explanation: Internships Portal

This project is a modern web application built with **Next.js** designed to help users find and manage internship opportunities.

## Key Technologies
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Frontend Library**: [React](https://reactjs.org/)
- **Backend/Database**: [Supabase](https://supabase.com/) (used for authentication and likely user data storage)
- **Data Processing**: Custom utilities for cleaning, categorizing, and extracting skills from internship descriptions.
- **Styling**: Global CSS and CSS Modules.

## Project Structure
- `/app`: Contains the main application logic, routes, and components using the Next.js App Router.
  - `/(main)`: Main application routes, including the home page (`page.tsx`) and internship details (`/role/[id]`).
  - `/account`: User account management pages.
  - `/api`: API routes for internal backend functionality.
  - `/components`: Reusable UI components (e.g., `InternshipList`, `AuthModal`, `RoleDetails`).
  - `/lib`: Utility functions, data fetching logic (`data.ts`), and Supabase client configuration.
- `/public`: Static assets, including the core data file `intern_data.json`.

## Core Features
1. **Internship Browsing**: Users can view a comprehensive list of internships fetched from a processed JSON dataset.
2. **Detailed View**: Each internship has a dedicated page showing full descriptions, requirements, and similar role recommendations.
3. **Search & Filter**: Real-time filtering and searching of internships based on search parameters (via `InternshipPageWithSearchParams`).
4. **Data Enrichment**:
   - **Categorization**: Automatically classifies internships into categories like Software, Data/AI, Design, etc.
   - **Skill Extraction**: Parses descriptions to identify key skills (e.g., Python, React, SQL).
   - **Data Cleaning**: Standardizes titles, companies, locations, and salary formats.
5. **User Accounts**: Authentication integration with Supabase, allowing for features like saving roles (via `useSavedRoles.ts`).

## Data Flow
1. Internship data is stored in `public/intern_data.json`.
2. `app/lib/data.ts` reads and processes this JSON file, adding IDs, categories, and extracted skills.
3. The `HomePage` fetches this data and passes it to client-side components for rendering and interactive filtering.
4. User interactions (like saving a role) are managed through Supabase.
