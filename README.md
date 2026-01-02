# 🏠 ReiDataTools CRM - Property Data Extractor

A powerful Next.js web application for extracting property information using free ArcGIS county assessor data across multiple states. Built for real estate investors, researchers, and data analysts.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)
![License](https://img.shields.io/badge/License-Private-red)

## ✨ Features

- 🗺️ **Multi-State Support**: Florida, Wisconsin, Texas, Arizona, California, Michigan
- 🔍 **Dual Search Modes**: Search by property address or parcel ID
- 📊 **CSV Upload**: Bulk process hundreds of properties at once
- ⚡ **Real-Time Data**: Direct integration with county assessor ArcGIS REST APIs
- 🎯 **Smart Matching**: Fuzzy address matching with 75%+ confidence scores
- 📥 **Export Results**: Download enriched data as CSV with all property details
- 🎨 **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- 🔒 **No API Keys**: All data sources are free and publicly accessible

## 🌎 Supported States

### Statewide Coverage (All Counties)
- **Florida** - 67 counties
- **Wisconsin** - Statewide parcel database
- **Michigan** - 83 counties

### County-Level Coverage
- **Texas** - Tarrant, Collin, Denton, Dallas area (4 counties)
- **Arizona** - Maricopa County
- **California** - Los Angeles County

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/crynxmartinez/reidatatools.git
cd reidatatools

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Usage

### Property Address Search

Upload a CSV with these headers:
```
property address,property city,property state,property zip
```

Example:
```csv
property address,property city,property state,property zip
123 Main St,Dallas,TX,75001
456 Oak Ave,Phoenix,AZ,85001
```

### Parcel ID Search

Upload a CSV with this header:
```
parcel id
```

Example:
```csv
parcel id
1234567890
R12345-678
```

## Data Retrieved

- Owner name and secondary owner
- Mailing address (full)
- Site/property address
- Parcel ID
- Assessed value
- Land and improvement values
- Property type
- Acreage
- County information
- Tax year

## 💻 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.2
- **Styling**: Tailwind CSS 3.3
- **Icons**: Lucide React
- **CSV Processing**: PapaParse
- **Fuzzy Matching**: Fuzzball (Levenshtein distance)
- **HTTP Client**: Axios
- **UI Components**: Custom React components

## 📁 Project Structure

```
ReiDataTools/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Home page (redirects)
│   │   ├── globals.css         # Global styles
│   │   └── data-extractor/     # Main feature page
│   ├── components/             # React components
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── StateSelector.tsx   # State dropdown
│   │   ├── SearchTypeToggle.tsx # Address/Parcel toggle
│   │   ├── CSVUploader.tsx     # File upload & processing
│   │   └── ResultsTable.tsx    # Results display & export
│   ├── services/               # Business logic
│   │   └── arcgis.ts           # ArcGIS API integration
│   ├── utils/                  # Utility functions
│   │   └── addressUtils.ts     # Address normalization
│   ├── config/                 # Configuration
│   │   └── states.ts           # State & county configs
│   └── types/                  # TypeScript types
│       └── index.ts            # Type definitions
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind config
└── next.config.js             # Next.js config
```

## 🔧 Development

```bash
# Run development server with hot reload
npm run dev

# Run TypeScript type checking
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 API Integration

The application integrates with free ArcGIS REST APIs from county assessor offices:

- **No API keys required** - All endpoints are publicly accessible
- **Real-time queries** - Direct database access
- **Multiple fallback** - Tries multiple counties for better coverage
- **Rate limiting** - Respects API rate limits with sequential processing

### Example API Endpoints

- Florida: `https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0`
- Michigan: `https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/Michigan_Parcels_v17a/FeatureServer/0`
- Texas (Dallas): `https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0`

## 🤝 Contributing

This is a private project. For questions or issues, please contact the repository owner.

## 📄 License

Private - ReiDataTools CRM © 2026

## 🙏 Acknowledgments

- County assessor offices for providing free public data
- ArcGIS REST API for robust geospatial services
- Next.js team for the amazing framework

---

**Built with ❤️ for real estate data analysis**
