# Personal Flexible Planner App

## Product Requirement Document (PRD)

## 1. Product Vision

Most planner applications are timeline-centric, forcing users to
schedule every task at a specific time.

However, in real life: - Some activities must happen at fixed times. -
Some tasks only need to be completed today. - Some behaviors should be
tracked daily.

This application introduces a **hybrid flexible planning system** that
separates:

-   Time commitments
-   Task management
-   Habit tracking

The goal is to create a **personal planning system that balances
structure and flexibility**.

------------------------------------------------------------------------

## 2. Target User

Current phase: - Single user - Personal productivity system

Future possibility: - Public productivity application

------------------------------------------------------------------------

## 3. Product Architecture

The system contains three main modules:

-   Planner (Time Blocks)
-   Tasks
-   Habits

These modules appear together in the **Daily Dashboard**.

------------------------------------------------------------------------

## 4. Core Features

### 4.1 Flexible Time Blocks

Used for scheduled commitments.

Examples: - Class - Work - Meeting

Unlike rigid calendar apps, blocks can also be flexible.

Example: - Deep Work (2 hours) - Gym (1 hour)

Fields:

-   id
-   title
-   duration
-   optional_start_time
-   date
-   note

Example:

Deep Work\
duration: 2h\
date: 2026-03-05

This allows both **time‑based scheduling and flexible duration blocks**.

------------------------------------------------------------------------

### 4.2 Todo Lists

Tasks are separated into three planning horizons.

#### Daily Todo

Tasks to complete today.

Examples: - Finish assignment - Read chapter 3 - Exercise

#### Weekly Todo

Tasks to complete this week.

Examples: - Buy groceries - Clean room - Call parents

#### Monthly Todo

Longer‑term tasks.

Examples: - Finish AWS certification - Read 3 books

Task fields:

-   id
-   title
-   list_type (daily / weekly / monthly)
-   priority
-   deadline
-   status
-   note

------------------------------------------------------------------------

### 4.3 Habit Tracker

Habits are **quantitative**.

Examples:

-   Drink Water --- 2000 ml
-   Walk --- 8000 steps
-   Study --- 120 minutes

Fields:

-   id
-   title
-   target_value
-   unit
-   date
-   current_value

Example:

Drink Water\
target: 2000\
unit: ml\
today: 1200

------------------------------------------------------------------------

### 4.4 Task ↔ Habit Conversion

Tasks can be converted into habits.

Example:

Task: - Read 20 pages

Converted Habit: - Habit: Read pages - Target: 20

This supports long‑term behavior building.

------------------------------------------------------------------------

## 5. Dashboard Layout

Main interface.

    TODAY

    Time Blocks
    9:00 - 11:00 Class
    Deep Work (2h)

    Daily Tasks
    [ ] Finish assignment
    [ ] Study chapter 3

    Habits
    Water: 1200 / 2000 ml
    Steps: 3500 / 8000

Design principle: **One‑screen daily planning**.

------------------------------------------------------------------------

## 6. Technical Architecture (MVP)

Because this application is for personal use, the architecture can
remain simple.

Backend options:

-   Node.js + Express + SQLite or
-   Python + FastAPI + SQLite

Database: - SQLite (local only)

Not included:

-   Authentication
-   Multi‑user support
-   Cloud sync

------------------------------------------------------------------------

## 7. Database Schema (MVP)

### tasks

-   id
-   title
-   list_type
-   priority
-   deadline
-   status
-   note
-   created_at

### time_blocks

-   id
-   title
-   date
-   start_time
-   duration
-   note

### habits

-   id
-   title
-   target_value
-   unit
-   created_at

### habit_logs

-   id
-   habit_id
-   date
-   value

------------------------------------------------------------------------

## 8. MVP Feature List

Initial version should only include essential functionality.

Core features:

-   Create time block
-   Create task
-   Create habit
-   Update habit progress
-   Dashboard view
-   Mark task complete

Features not included in MVP:

-   Notifications
-   Calendar sync
-   Analytics
-   AI planning
-   Mobile application

------------------------------------------------------------------------

## 9. Future Features

Possible future improvements:

-   AI daily planner
-   Automatic scheduling
-   Weekly productivity reports
-   Habit statistics
-   Calendar integration
-   Mobile app

------------------------------------------------------------------------

## 10. Design Principles

The product should follow these principles:

1.  Flexibility over rigidity
2.  Minimal planning friction
3.  Fast daily planning
4.  Clear visual hierarchy
