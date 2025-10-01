<a id="top"></a>
![Banner](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsDL2Zoe07JbvAUK9H3SwHSDDy6Hm2LM-9cg&s)
# 🚀 JOBSYNC – AI-Powered Job Opportunity Finder

## 🏆 Built at a Hackathon | **Top 5 out of 30+ Teams!**

🎯 **AI-driven platform designed to empower job seekers, especially from underprivileged communities, by simplifying the job search process through smart recommendations, mentorship, and skill development programs**

![License](https://img.shields.io/github/license/adityagarwal15/JobSync)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![GSSoC'25](https://img.shields.io/badge/GSSoC-2025-orange)
![Stars](https://img.shields.io/github/stars/adityagarwal15/JobSync?style=social)

---

## 📌 About JOBSYNC

**JOBSYNC** is an AI-driven platform designed to **empower job seekers, especially from underprivileged communities,** by simplifying the job search process. Using AI, web scraping, and smart recommendations, it connects users with the **right jobs, mentorship, and skill development programs.**

---

## 🌐 Live Demo

### 🚀 Experience JobSync Now  
Visit the live platform: [jobsync-new.onrender.com](https://jobsync-new.onrender.com)

### 📸 **Screenshots**
![JobSync Screenshot](https://res.cloudinary.com/dcf0cpuqf/image/upload/v1738695543/Screenshot_2025-02-02_181936_qpdcqu.png)

### 🎥 **Walkthrough Video**
[![Portfolio Walkthrough](https://res.cloudinary.com/dcf0cpuqf/image/upload/v1738695543/Screenshot_2025-02-02_181936_qpdcqu.png)](https://res.cloudinary.com/dcf0cpuqf/video/upload/v1738695592/JOBSYNC-LANDING_aopixn.mp4)
> *Click the image above to watch the demo video!*

---

## 🚀 Features (Current + Planned)

### ✅ **Currently Implemented**
- 🎨 **Beautiful UI/UX**: Modern, responsive design with smooth animations
- ✨ **GSAP Animations**: Professional transitions and scroll effects  
- 📱 **Multi-page Layout**: Home, Jobs, Login, Profile pages
- 🔍 **Job Listings Interface**: Card-based job display with filtering UI
- 📱 **Mobile Responsive**: Works across all device sizes
- 🔐 **User Authentication**: Signup, login, session-based access control
- 🛢️ **Database Integration**: MongoDB used to store users securely
- 📧 **Email Notifications:** Sends email !!!!!!

### 🚧 **Planned Features (Need Contributors!)**

#### 🤖 AI-Powered Intelligence
- **Smart Job Matching**: AI analyzes profiles and suggests matches
- **Gemini AI Chatbot**: 24/7 career guidance and interview prep
- **Personalized Recommendations**: Machine learning for job suggestions

#### 🔍 Real-Time Job Discovery
- **Live Job Scraping**: Fresh opportunities from multiple sources
- **Advanced Filtering**: Location, salary, skills, company filters
- **Search Functionality**: Smart job search with filters

#### 🛠️ Backend Development
- **Profile Management**: User profiles with skills and preferences
- **Job Application Tracking**: Monitor application status
- **Database Integration** *(partially implemented)*: Currently storing user emails and passwords, will expand to include profiles, job listings, applications etc.

#### 📊 Analytics & Insights
- **Application Tracking**: Monitor job application journey
- **Market Insights**: Salary trends and industry data
- **Skill Gap Analysis**: Identify areas for growth

---

## 🏁 Getting Started

### Prerequisites
- Basic knowledge of:
- HTML, CSS, JavaScript *(for frontend contributions)* & Express.js & MongoDB *(for backend contributions)*
- Node.js (v14+)
- MongoDB Atlas or local MongoDB instance
- A modern web browser

### 🛠️ Current Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/adityagarwal15/JobSync.git
cd JobSync
```

#### 2️⃣ Install dependencies
```bash
npm install
```

#### 3️⃣ Set Up Environment Variables
- Create a .env file in the root directory and add the following:
```bash
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```
### 4️⃣ Run the Project
```bash
# Option 1: Start normally
node server.js

# Option 2: Use nodemon for development (auto-restarts on changes)
npx nodemon server.js
```
---

## 🧑‍💻 Tech Stack

### ✅ **Currently Used**
* 🌐 **Frontend**:
* **HTML5**: Semantic markup and structure
* **CSS3**: Modern styling with custom properties
* **JavaScript ES6+**: Interactive functionality
* **EJS**: Templating engine for rendering dynamic content on the server
* **GSAP**: Professional animations and transitions
* **Lenis**: Smooth scrolling experience
* **ScrollTrigger**: Scroll-based animations

* 🧠 **Backend**
* **Node.js**: JavaScript runtime for server-side operations
* **Express.js**: Lightweight web framework for routing and APIs
* **MongoDB**: NoSQL database for storing user credentials and data
* **Mongoose**: Object modeling for MongoDB
* **bcrypt**: Password hashing for secure authentication
* **express-session**: Session management for persistent login
* **dotenv**: Environment variable handling for secure configuration

### 🚧 **Planned Technologies (Contributors Needed)**

#### AI & Data

* **Gemini AI API**: Intelligent chatbot and recommendations
* **Web Scraping Libraries**: Puppeteer, Cheerio, or similar
* **RESTful APIs**: Efficient data communication

#### Authentication & Security

* **JWT**: JSON Web Tokens for authentication
* **bcrypt**: Password hashing *(implemented)*
* **express-session**: Session-based login *(implemented)*

---

## 📁 Project Structure

```text
📁 JobSync/
├── 📄 .env                  – Environment variables
├── 📄 .gitignore            – Git ignored files
├── 📄 .prettierrc           – Prettier config
├── 📄 CODE_OF_CONDUCT.md    – Contributor conduct guide
├── 📄 CONTRIBUTING.md       – Contribution guidelines
├── 📄 LICENSE               – Project license
├── 📄 eslint.config.mjs     – ESLint configuration
├── 📄 package.json          – Project dependencies & scripts
├── 📄 package-lock.json     – Dependency lock file
├── 📄 README.md             – Project documentation
├── 🧠 server.js             – Express server entry point

📁 views/                    – 🌐 EJS templates for dynamic pages
│   ├── 🏠 index.ejs
│   ├── 🔐 login.ejs
│   ├── 👤 profile.ejs
│   ├── 📝 signup.ejs
│   └── 📄 user.ejs

📁 public/                   – 🌟 Frontend static assets
│
├── 📁 js/                   – 💡 JavaScript for interactivity
│   ├── 🔧 about.js
│   ├── 🧾 form.js
│   ├── 💼 job.js
│   ├── 🎢 lenis.js
│   ├── ⏳ loader.js
│   ├── 🔐 login.js
│   ├── 📱 menu.js
│   ├── 💰 prices.js
│   ├── 👤 profile.js
│   ├── 📊 projects.js
│   └── 🎯 scroll-test.js
│
├── 📁 css/                  – 🎨 Styling for each component/page
│   ├── 🧭 about.css
│   ├── ✨ features.css
│   ├── 🦶 footer.css
│   ├── 📦 global.css
│   ├── 🚀 hero.css
│   ├── 💼 job.css
│   ├── ⏳ loader.css
│   ├── 🔐 login.css
│   ├── 📱 menu.css
│   ├── 🧭 nav.css
│   ├── 💰 prices.css
│   ├── 🏞️ prices-hero.css
│   ├── 👤 profile.css
│   ├── 📊 projects.css
│   ├── 🧲 promo.css
│   ├── 🛠️ services.css
│   └── 📝 signup.css
│
└── 📁 assets/               – 🖼️ Images & icons
    ├── 🖼️ feature-1.png
    ├── 🖼️ feature-2.png
    ├── ...
    └── 🚀 site-logo.png

📁 node_modules/             – 📦 Installed dependencies

```

---

## 📌 GSSoC '25 Contributor Guidelines

🎉 **We welcome beginners, first-timers, and all open-source enthusiasts!**

### How to Contribute

1. 🔖 Check out our **[Contributing Guide](./CONTRIBUTING.md)**
2. 🐞 Look for issues labeled `good first issue` or `beginner-friendly`
3. 📚 Read our **[Code of Conduct](./CODE_OF_CONDUCT.md)**
4. 💬 Join discussions and ask questions
5. 🚀 Submit your first PR!

### 🎯 **High Priority Contribution Areas**

#### 🖥️ **Frontend Improvements** *(Good for Beginners)*

* 🐛 **Bug Fixes**: Responsive issues, cross-browser compatibility
* 🎨 **UI/UX Enhancements**: Improve existing pages, add hover effects
* 📱 **Mobile Optimization**: Perfect mobile experience
* ♿ **Accessibility**: ARIA labels, keyboard navigation, color contrast
* ✨ **Animation Polish**: Enhance GSAP animations, add micro-interactions

#### ⚙️ **Backend Development** *(Intermediate)*

* 🏗️ **API Development**: Create RESTful APIs for jobs, users, applications
* 🔐 **Authentication**: JWT-based login/signup system
* 🔍 **Search Functionality**: Advanced job search with filters

#### 🤖 **AI & Advanced Features** *(Advanced)*

* 🧠 **Gemini AI Integration**: Chatbot for career guidance
* 🕷️ **Web Scraping**: Real-time job data from job boards
* 📊 **Recommendation Engine**: AI-powered job matching
* 📈 **Analytics Dashboard**: User insights and job market trends

#### 🛠️ **DevOps & Infrastructure**

* 🧪 **Testing**: Unit tests and integration tests
* 📝 **Documentation**: API docs, code comments
* 🔧 **Performance**: Optimization and caching

---

## 🙋‍♀️ Want to Contribute?

```bash
1. 🍴 Fork the repo
2. 📥 Clone your fork: git clone https://github.com/your-username/JobSync.git
3. 🌿 Create a new branch: git checkout -b feature/amazing-feature
4. ✨ Make your changes
5. 📤 Push and raise a PR: git push origin feature/amazing-feature
```

**Pro tip**: Start small with documentation improvements or UI fixes, then work your way up to bigger features!

---

## 🧠 Project Admin & Mentors

### Project Maintainer

* 👨‍💻 **Aditya Agarwal** - [GitHub Profile](https://github.com/adityagarwal15)

  * Email: [adityaagarwal0081@gmail.com](mailto:adityaagarwal0081@gmail.com)
  * Portfolio: [https://adityagarwal.netlify.app](https://adityagarwal.netlify.app)
  * Full-stack developer passionate about AI and social impact technology

### GSSoC 2025 Mentorship

* 🌟 **GSSoC Mentors** will be assigned soon
* 💬 **Community Support** available via GitHub Discussions
* 📧 **Direct Help** through issue comments and PR reviews

---

## 🌟 Contributors

Thanks goes to these wonderful people who have made JobSync better:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

<!-- prettier-ignore-start -->

<!-- markdownlint-disable -->

*Contributors will be automatically added here*

<!-- markdownlint-restore -->

<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

**Want to see your name here? Start contributing today! 🚀**

---

## 📊 Project Stats

![GitHub contributors](https://img.shields.io/github/contributors/adityagarwal15/JobSync)
![GitHub issues](https://img.shields.io/github/issues/adityagarwal15/JobSync)
![GitHub pull requests](https://img.shields.io/github/issues-pr/adityagarwal15/JobSync)
![GitHub last commit](https://img.shields.io/github/last-commit/adityagarwal15/JobSync)

---

## 🗺️ Development Roadmap

### Phase 1: Foundation *(Current - Frontend Complete)*

* ✅ Basic HTML/CSS/JS structure
* ✅ GSAP animations implementation
* ✅ Responsive design across pages
* ✅ Basic job listings UI

### Phase 2: Backend Development *(Partially done - Contributors Needed)*

* 🔄 Basic API endpoints (users, jobs)

### Phase 3: Core Features *(Contributors Needed)*

* 📝 Job application system
* 🔍 Advanced search and filtering
* 👤 User profile management
* 📊 Basic analytics dashboard

### Phase 4: AI Integration *(Advanced Contributors)*

* 🤖 Gemini AI chatbot
* 🕷️ Web scraping for real job data
* 🎯 AI-powered job recommendations
* 📈 Smart career insights

### Phase 5: Advanced Features *(Future)*

* 📱 Progressive Web App (PWA)
* 🔔 Real-time notifications
* 💼 Company profiles and reviews
* 🌐 Multi-language support

---

## 📝 Documentation

* 📖 **[API Documentation](./docs/api.md)** - Complete API reference
* 🎨 **[UI Components](./docs/components.md)** - Reusable component library
* 🚀 **[Deployment Guide](./docs/deployment.md)** - How to deploy JobSync
* 🧪 **[Testing Guide](./docs/testing.md)** - Running and writing tests

---

## 🤝 Community & Support

* 💬 **[GitHub Discussions](https://github.com/adityagarwal15/JobSync/discussions)** - Ask questions and share ideas
* 🐛 **[Issue Tracker](https://github.com/adityagarwal15/JobSync/issues)** - Report bugs and request features
* 📧 **Email**: [adityaagarwal0081@gmail.com](mailto:adityaagarwal0081@gmail.com)
* 🌐 **Live Platform**: [https://jobsyncc.netlify.app](https://jobsyncc.netlify.app)
* 👤 **Portfolio**: [https://adityagarwal.netlify.app](https://adityagarwal.netlify.app)

---

## ⭐ Support & Future Plans

We're excited to expand JOBSYNC with more features! If you find this useful:

* 🌟 **Drop a ⭐ on this repo**
* 🚀 **Stay tuned for updates**
* 🤝 **Join our contributor community**
* 💡 **Share your ideas and feedback**

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

* 🏆 **GSSoC 2025** for providing this amazing platform
* 🤖 **Google Gemini AI** for powering our intelligent features
* 🎨 **GSAP Community** for incredible animation resources
* 🌟 **All Contributors** who make this project possible

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

**Made with ❤️ for the open source community**

[⬆ Back to Top](#top)

</div>
