# Project Setup Guide

This project is composed of three main parts: a FastAPI-based AI service, a Spring Boot backend, and a Next.js frontend. Each service runs independently but is designed to work together as a unified system. This guide explains how to set up and run the entire stack on a Windows development environment.

---

## Overview

The FastAPI service is responsible for AI-related operations such as embeddings, RAG pipelines, and data processing. The Spring Boot application acts as the core backend, handling business logic, APIs, and database interaction. The Next.js application provides the user interface.

All three services communicate over HTTP, so they can be run separately during development.

---

## Prerequisites

Before setting up the project, ensure that your system has the required tools installed. You should have Python 3.10 or later, Node.js (preferably LTS), and Java 17 or later. It is also recommended to have Maven or Gradle installed for the Spring Boot service. On Windows, PowerShell is preferred over Git Bash for backend services to avoid path and execution issues.

---

## FastAPI (AI Engine) Setup

Navigate to the FastAPI project directory. Create a virtual environment using Python and activate it. On Windows PowerShell, you may need to allow script execution once before activating the environment.

After activating the virtual environment, install the dependencies listed in the `requirements.txt` file. Once installation is complete, start the FastAPI server using Python’s module execution instead of the direct executable. This avoids Windows security restrictions that may block virtual environment binaries.

The server will start on the default port 8000. You can access the interactive API documentation through the `/docs` endpoint in your browser. This interface allows you to test endpoints such as embeddings, query processing, and dataset operations.

---

## Spring Boot Backend Setup

Move to the Spring Boot project directory. If you are using Maven, ensure dependencies are downloaded and the project builds successfully. You can run the application using your IDE or through the command line.

The backend typically runs on port 8080. It is responsible for handling application logic, authentication, and communication with the database. Ensure that any required environment variables or configuration files are properly set before starting the server.

If the backend depends on the FastAPI service, confirm that the FastAPI server is already running and accessible.

---

## Next.js Frontend Setup

Navigate to the frontend directory and install the required Node.js dependencies. Once installation is complete, start the development server. The frontend will usually run on port 3000.

The application will automatically reload as you make changes. Ensure that API base URLs are correctly configured so that the frontend can communicate with the Spring Boot backend.

---

## Environment Configuration

Each service may require environment variables. The FastAPI service typically uses a `.env` file for configuration such as API keys or database connections. The Spring Boot application uses `application.yml` or `application.properties`. The Next.js application uses `.env.local`.

Make sure that URLs between services are consistent. For example, the frontend should point to the Spring Boot API, and the Spring Boot service should point to the FastAPI endpoints where necessary.

---

## Running the Full System

To run the full application, start each service in its own terminal. Begin with the FastAPI service so that AI endpoints are available. Next, start the Spring Boot backend to initialize business logic and API routes. Finally, start the Next.js frontend to interact with the system through the browser.

Once all services are running, open the frontend in your browser and verify that it can successfully communicate with the backend and AI services.

---

## Troubleshooting

If Python commands fail in Git Bash, switch to PowerShell, as it handles virtual environments more reliably on Windows. If you encounter issues running Uvicorn, use Python module execution instead of the executable. If scripts are blocked in PowerShell, adjust the execution policy for the current user.

Ensure that ports are not already in use and that all dependencies are installed correctly. Restarting terminals after environment changes can also resolve unexpected issues.

---

## Notes

This architecture is designed to be modular. Each service can be developed, tested, and deployed independently. For production environments, consider using Docker to containerize each service and manage them through a unified orchestration setup.

---