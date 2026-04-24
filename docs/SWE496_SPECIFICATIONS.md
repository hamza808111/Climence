# SWE496 Part-I Specifications (Extracted)

This document is a working implementation spec extracted from:

- `Template Report SWE 496 (2).pdf`
- Local extraction: `data/swe496-template-extracted.txt` (67 pages)
- Extraction date: 2026-04-24

## 1) Product Scope

Build an intelligent air-pollution monitoring system for Saudi Arabia with Riyadh as the primary operational focus.

Core product outcomes:

- Continuous ingestion of real-time and historical air-quality data.
- Interactive pollution visualization and AQI mapping.
- Hotspot detection and forecast analytics.
- Alerts and structured reporting for decision-makers.

## 2) Stakeholders and Roles

- Ministry of Environment, Water and Agriculture (primary institutional stakeholder).
- Administrator: manages configuration, reports, and system settings.
- Analyst: monitors map/analytics and consumes alerts.
- Viewer: read-only monitoring access.

## 3) Domain Goals

- Monitor real-time pollution levels, especially in Riyadh.
- Provide interactive map exploration and filtering.
- Detect/classify pollution sources (traffic, industrial, dust storms).
- Forecast pollution behavior with AI.
- Support data-driven policy and operations aligned with Vision 2030.

## 4) Data Sources (Target)

- OpenAQ (real-time AQI/pollutant feeds).
- EPA AirData (historical datasets for model training/evaluation).
- Sentinel-5P (satellite atmospheric pollutant data).
- ERA5 (weather factors: temperature, humidity, wind).
- IoT sensors and drone-collected readings.

## 5) Functional Specification (High-Level)

- Data integration from IoT, drones, external APIs.
- Secure login and role-based access.
- Real-time map with zoom/pan and pollutant switching.
- AQI display by region plus filter controls.
- Historical trends and forecast views.
- Hotspot detection and future source analysis.
- Alerting on threshold exceedance with configurable thresholds.
- Report generation/export (PDF/Excel) and report scheduling.

## 6) Non-Functional Specification

- Performance: updated air-quality data to users within 5 seconds of availability.
- Scalability: seamless growth with more users and data sources.
- Availability: 24/7 target, 99.5% uptime.
- Reliability: automatic backups and recovery mechanisms.
- Security: authentication + encryption in transit and at rest.
- Usability: responsive UI across desktop/tablet/mobile.
- Localization: Arabic/English support.
- Maintainability: operational logs, error monitoring, non-disruptive updates.
- Portability: major browsers (Chrome, Edge, Safari, Firefox), cloud/on-prem support.

## 7) Target Architecture

Layered, cloud-oriented architecture:

- Edge and Device Gateway.
- Data Acquisition Layer.
- Data Processing and Storage Layer:
  - Real-time stream processing.
  - Batch processing/model training.
  - AI inference services.
  - Time-series + spatial + object storage.
- Application Services Layer:
  - AuthN/AuthZ, monitoring, analytics, reporting, admin.
  - WebSocket delivery for live updates.
- User Interface Layer:
  - Heatmap, filters, trends, forecasts, reporting.

## 8) Key Algorithm Specs

Hotspot detection:

- Filter high-pollution points over threshold.
- Optionally cluster by zone/grid.
- Compute weighted center of gravity.
- Estimate hotspot radius from point distances.
- Render hotspot overlays and update continuously.

Trend detection:

- Fit linear trend over recent AQI window.
- Slope interpretation:
  - `m > 0`: worsening.
  - `m < 0`: improving.
  - `m ~= 0`: stable.

## 9) Primary Use Cases

- UC1: View Real-Time Pollution Map.
- UC2: View Historical Pollution Trends.
- UC3: View Pollution Forecast.
- UC4: Generate Pollution Reports.
- UC-A1: Filter Pollution Data.
- UC-A2: Identify Pollution Hotspots.
- UC-A3: Receive Pollution Alerts.
- UC-A4: Set Alert Thresholds.
- UC-A5: Schedule Automated Report.
- UC-A6: Log In.

## 10) Testing Expectations (from report scenarios)

Representative expected behaviors:

- Valid telemetry ingestion and unit normalization.
- Alert trigger and clearance behavior.
- Hotspot center-of-gravity correctness.
- Role/permission enforcement.
- Map rendering and region filtering.
- Report generation/export behavior.
- Data validation for malformed payloads.
- Rate-limiting/abuse protection.
