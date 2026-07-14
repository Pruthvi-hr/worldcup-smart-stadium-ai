🏟️ World Cup 2026 Smart Stadium Operations Platform

🎯 Chosen Vertical

[Challenge 4] Smart Stadiums & Tournament Operations

🧠 Approach and Logic

The massive scale of the 2026 World Cup requires moving beyond static maps. Our approach was to build a dynamic, GenAI-powered web application that acts as a real-time central nervous system for the stadium.

The underlying logic relies on splitting the user experience into two distinct, role-based portals:

The Fan Portal: A frictionless interface requiring no app download, focused on 3D navigation, instant translation, and real-time safety routing.

The Volunteer Command Node: A secured dashboard utilizing Object-Oriented logic to triage incoming fan requests and dispatch the closest staff members.

Instead of traditional routing, we treat the stadium as a dynamic graph network where "node weights" (crowd density) update in real-time, allowing the AI to calculate the safest paths.

⚙️ How the Solution Works

Explainable AI Routing: The application uses Google Gemini to process live data (like gate congestion) and outputs both a safe route and an explanation (e.g., "Rerouting to Gate C to avoid a 30-minute delay at Gate A").

Multimodal Cultural Translator: The AI acts as a localized interpreter, understanding North American slang and mapping foreign language requests directly to local stadium infrastructure.

Dynamic UI (No Static Pages): The React frontend dynamically shifts states based on whether a user authenticates as a Fan or a Volunteer, rendering only the necessary real-time data components.

📝 Assumptions Made

Data Feeds: We assume the existence of active IoT sensors (ticket scanners, camera feeds) providing real-time congestion percentages. For this submission, this data is mocked securely via local JSON state.

Connectivity: We assume fans have basic cellular or stadium Wi-Fi connectivity to access the Progressive Web App (PWA).

🛠️ Tool Usage Enforcement

Which Tools Were Used

Bolt.new: For GenAI code generation (Vibe Coding) and instantaneous browser-based rendering.

Google Gemini 1.5 Flash API: As the core reasoning engine for the smart assistant, routing logic, and translation.

React / Vite / Tailwind CSS: For the lightweight, highly accessible frontend framework.

Why They Were Selected

Bolt.new was chosen for its velocity. It allows rapid iteration of React components and automatically configures environment variables securely.

Gemini 1.5 Flash was selected for its high-speed inference, generous context window, and ability to process strict system prompts without hallucinating.

How Prompts Evolved

Initial Prompt (Structural): We started by prompting the AI to build the foundational React UI with strict semantic HTML for accessibility and a dual-login state.

Second Prompt (Integration): We evolved the prompt to inject the Gemini API, strictly grounding the model with a low temperature (0.2) and local mock data to prevent off-topic hallucinations.

Final Prompt (Hardening): We explicitly prompted the AI to write unit tests for edge cases (missing API keys, invalid logins) to maximize our automated testing score.

GenAI vs. Human Design

What Humans Designed: The overall system architecture, the dual-role graph routing logic, the prompt engineering strategy, the edge-case definitions, and the specific application of multimodal translation to solve the given problem statement.

What GenAI Handled: The boilerplate React component creation, Tailwind CSS styling, automated unit test writing, and the real-time natural language processing (parsing user queries and formatting the explainable routing responses).
