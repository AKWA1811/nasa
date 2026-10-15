<div align="center">

  <!-- Header Banner / Shields -->
  <p align="center">
    <img src="https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Global%20Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white" alt="NASA Space Apps" />
    <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Supabase-Realtime_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>

  <!-- Animated Pulse Effect Banner -->
  <a href="#">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=1000&color=38BDF8&center=true&vCenter=true&width=700&height=70&lines=🌌+SKYQUAKE%3A+Infrasound+%26+Seismic+Detection;☄️+Meteor+vs.+Earthquake+Multi-Sensor+Mesh;🛰️+Powered+by+Next.js+%2B+Supabase+Realtime" alt="Typing Banner" />
  </a>

  <p align="center">
    <b>An AI & Multi-Sensor Web Platform Distinguishing Bolide Fireballs, Earthquakes & Ground Noise</b>
  </p>

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-classification-heuristics">Physics & Logic</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-database-architecture">Database</a> •
    <a href="#-quick-start">Quick Start</a>
  </p>

  ---
</div>

## 🌌 About The Project / نبذة عن المشروع

**SKYQUAKE** is an advanced web monitoring platform built for the **NASA Space Apps Challenge**. It fuses low-frequency atmosphere pressure waves (**Infrasound**) with high-frequency ground vibrations (**Seismic signals**) across a distributed IoT sensor mesh. 

When high-velocity atmospheric meteors (bolides/fireballs) enter Earth's atmosphere, they generate characteristic supersonic **N-wave shockwaves**. By correlating acoustic infrasound with ground seismic signals and barometric variations, **SKYQUAKE** classifies atmospheric and tectonic events in real time, determining approximate trajectory, origin, and confidence levels while eliminating localized false positives.

> **منصة "SKYQUAKE":** منصة ويب متكاملة تجمع وتحلل إشارات الموجات الصوتية المنخفضة التردد (Infrasound) والاهتزازات الأرضية (Seismic) لتمييز واكتشاف مسارات النيازك والكرات النارية (Fireballs) عن الزلازل الطبيعية والأنشطة البشرية بدرجة ثقة ومعايير عدم يقين دقيقة.

---

## ✨ Key Features / الميزات الرئيسية

| Feature | Description / الوصف |
| :--- | :--- |
| **🛰️ Live Sensor Mesh Dashboard** | Real-time monitoring of active IoT sensors (Raspberry Pi, Mobile Accel/Mic, Barometer) with spatial GPS coordination. |
| **📈 Waveform & Spectrogram Analysis** | Real-time FFT analysis, frequency band energy splitting ($0\text{--}1\text{ Hz}$, $1\text{--}5\text{ Hz}$, $5\text{--}20\text{ Hz}$), and peak SNR calculations. |
| **☄️ Meteor vs. Earthquake Triangulation** | Automated cross-sensor heuristic matching detecting supersonic **N-waves** vs. classic seismic **P-wave / S-wave** progressions. |
| **🗺️ Interactive Trajectory Map** | Visual back-azimuth directional indicators, arrival time deltas, and uncertainty radius overlays. |
| **🎮 Interactive Demo Mode** | Instant zero-latency simulation engine pushing synthetic meteor strikes, tectonic earthquakes, or construction noise to test system response. |
| **📊 Researcher Portal & Export** | Raw data streaming with direct JSON/CSV export, SNR thresholds, and ground-truth confirmation loops to reduce false positive rates. |

---

## ⚡ Heuristic Classification Logic / خوارزمية التمييز الفيزيائية
                      ┌──────────────────────────┐
                      │   Incoming Signal Data   │
                      └─────────────┬────────────┘
                                    │
                                    ▼
                     ┌────────────────────────────┐
                     │ Threshold & SNR Check (>3) │
                     └──────────────┬─────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             │                                             │
             ▼                                             ▼
 [Strong Infrasound Wave]                      [Strong Ground Vibration]
             │                                             │
    N-Wave Shockwave?                             P-wave -> S-wave progression?
    /               \                             /                     \
  YES                NO                         YES                      NO
  /                    \                       /                          \
☄️ Meteor Candidate    Noise / Explosion     🌋 Earthquake Candidate    Local Construction


### 🔬 Physical Event Signatures:
1. **Meteor / Fireball Candidate:** High infrasound energy, distinctive shockwave **N-wave profile**, dominant frequency $0.1\text{--}5\text{ Hz}$, brief pulse duration, absent $P/S$ seismic progression.
2. **Earthquake Candidate:** Distinct $P\text{-wave}$ arrival followed by $S\text{-wave}$, slower acoustic infrasound delay, broad regional sensor ground triggers.
3. **Construction / Industrial Noise:** Single sensor triggers, high localized frequencies ($>15\text{ Hz}$), high periodicity, zero multi-station correlation.

---

## 🛠️ Tech Stack / التقنيات المستخدمة

<div align="center">

| Component | Technology | Logo |
| :--- | :--- | :---: |
| **Frontend Framework** | Next.js 15 (App Router, Server Actions) | <img src="https://skillicons.dev/icons?i=nextjs" width="32"/> |
| **UI Library & Styling** | React 19, Tailwind CSS v4, Shadcn UI | <img src="https://skillicons.dev/icons?i=react,tailwind" width="64"/> |
| **Database & Realtime** | Supabase PostgreSQL with RLS & Realtime Engine | <img src="https://skillicons.dev/icons?i=supabase,postgres" width="64"/> |
| **Data Analytics & Charts** | Recharts, Lucide Icons, TypeScript | <img src="https://skillicons.dev/icons?i=ts" width="32"/> |
| **Deployment** | Vercel Edge Network | <img src="https://skillicons.dev/icons?i=vercel" width="32"/> |

</div>

---

## 🗄️ Database Schema / هيكل قاعدة البيانات

The platform utilizes a reactive PostgreSQL schema configured on Supabase:

<details>
<summary>🔍 <b>Click to expand Database Tables</b></summary>

```sql
-- Core System Tables
1. users_devices      : Sensor hardware metadata, GPS position, device health & last_seen.
2. sensor_readings    : Raw time-series stream (Infrasound, Acceleration, Pressure).
3. events             : High-level detected event records with confidence ratings.
4. event_detections   : Individual station pulse arrivals, back-azimuth, SNR, peak amplitudes.
5. signal_features    : FFT peak metrics, N-wave shock booleans, band-energy calculations.
6. classifications    : Heuristic/ML model prediction outputs with explanations.
7. location_estimates : Spatial trajectory estimates with uncertainty bounds.
