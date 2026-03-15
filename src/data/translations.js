const translations = {
  en: {
    nav: {
      about: "About",
      experience: "Experience",
      projects: "Projects",
      photography: "Photography",
      contact: "Contact",
    },
    hero: {
      greeting: "Hello, I'm",
      name: "remker1",
      title: "Software Developer & Photographer",
      description:
        "Computer Science graduate from the University of Saskatchewan. Building software by day, capturing moments through the lens in my free time.",
      viewWork: "View My Work",
      getInTouch: "Get in Touch",
    },
    about: {
      heading: "About Me",
      bio1: "I'm a Computer Science graduate from the ",
      university: "University of Saskatchewan",
      bio1End:
        " with a passion for building clean, functional software. I enjoy working across the full stack — from designing intuitive user interfaces to building robust backend systems.",
      bio2: "Outside of coding, photography is my creative outlet. I love exploring the world through a lens, capturing landscapes, street scenes, and everyday moments that tell a story.",
      techHeading: "Technologies & Tools",
    },
    experience: {
      heading: "Experience",
      roles: [
        {
          title: "Computer Technician",
          company: "Uniway Computers",
          period: "Present",
          description:
            "Diagnosing and repairing hardware and software issues. Providing technical support and building custom PC systems for clients. Managing inventory and ensuring quality service delivery.",
        },
        {
          title: "Full Stack Developer Intern",
          company: "GridLabel",
          period: "Internship",
          description:
            "Developed and maintained full-stack web applications. Worked with modern frameworks and tools to deliver features across frontend and backend. Collaborated with the team on product development and code reviews.",
        },
      ],
    },
    projects: {
      heading: "Projects",
      items: [
        {
          title: "RenoMana",
          description:
            "A CMPT 370 school assignment project: a renovation management platform for small contractors. It supports project scheduling, inventory and employee assignment tracking, customer renovation requests, and review collection through a JavaFX desktop app with a Flask + MongoDB backend.",
          tags: ["Java", "JavaFX", "Flask", "MongoDB", "Docker"],
        },
        {
          title: "USask GPA Estimator",
          description:
            "An unofficial GPA calculator that parses USask unofficial transcript PDFs and gives a quick academic standing estimate. It supports editing grades, adding future courses for simulation, and handling retaken courses by using the newest grade.",
          tags: ["Python", "Tkinter", "PDF Parsing", "Data Processing"],
        },
      ],
    },
    photography: {
      heading: "Photography",
      description:
        "Photography is my creative escape. I enjoy capturing landscapes, street scenes, and candid moments. Here are a few of my favourites.",
      viewGallery: "View Full Gallery",
    },
    gallery: {
      heading: "Photography Gallery",
      description:
        "A collection of moments captured through my lens. Landscapes, street photography, and everyday scenes that caught my eye.",
      backHome: "Back Home",
    },
    contact: {
      heading: "Get in Touch",
      description:
        "I'm always open to new opportunities and conversations. Whether you have a question, a project idea, or just want to say hi — feel free to reach out.",
      cta: "Say Hello",
    },
    footer: {
      rights: "All rights reserved.",
      builtWith: "Built with React & Tailwind CSS",
    },
  },

  zh: {
    nav: {
      about: "关于",
      experience: "经历",
      projects: "项目",
      photography: "摄影",
      contact: "联系",
    },
    hero: {
      greeting: "你好，我是",
      name: "remker1",
      title: "软件开发者 & 摄影爱好者",
      description:
        "萨斯喀彻温大学计算机科学专业毕业。白天编写代码，闲暇时用镜头捕捉生活中的美好瞬间。",
      viewWork: "查看作品",
      getInTouch: "联系我",
    },
    about: {
      heading: "关于我",
      bio1: "我毕业于",
      university: "萨斯喀彻温大学",
      bio1End:
        "计算机科学专业，热爱构建简洁、实用的软件。我喜欢全栈开发——从设计直观的用户界面到构建稳健的后端系统。",
      bio2: "在编程之外，摄影是我的创意出口。我喜欢用镜头探索世界，捕捉风景、街头场景和日常生活中的动人瞬间。",
      techHeading: "技术与工具",
    },
    experience: {
      heading: "工作经历",
      roles: [
        {
          title: "计算机技术员",
          company: "Uniway Computers",
          period: "至今",
          description:
            "诊断和修复硬件及软件问题。为客户提供技术支持并组装定制电脑系统。管理库存并确保优质服务交付。",
        },
        {
          title: "全栈开发实习生",
          company: "GridLabel",
          period: "实习",
          description:
            "开发和维护全栈Web应用程序。使用现代框架和工具在前后端交付功能。与团队协作进行产品开发和代码审查。",
        },
      ],
    },
    projects: {
      heading: "项目",
      items: [
        {
          title: "RenoMana",
          description:
            "CMPT 370 课程作业项目：面向小型装修公司的管理平台。支持项目排期、库存与员工分配管理，并提供客户装修申请和评价反馈功能。桌面端使用 JavaFX，后端基于 Flask + MongoDB。",
          tags: ["Java", "JavaFX", "Flask", "MongoDB", "Docker"],
        },
        {
          title: "USask GPA Estimator",
          description:
            "一个非官方 GPA 计算工具：解析萨大非官方成绩单 PDF，快速估算当前学业成绩。支持修改成绩、添加未来课程做模拟，并在重修场景下使用最新成绩进行计算。",
          tags: ["Python", "Tkinter", "PDF Parsing", "Data Processing"],
        },
      ],
    },
    photography: {
      heading: "摄影",
      description: "摄影是我的创意避风港。我喜欢捕捉风景、街头场景和自然的瞬间。以下是我最喜欢的一些作品。",
      viewGallery: "查看完整画廊",
    },
    gallery: {
      heading: "摄影画廊",
      description: "用镜头捕捉的瞬间合集。风景、街头摄影以及吸引我目光的日常场景。",
      backHome: "返回首页",
    },
    contact: {
      heading: "联系我",
      description: "我随时欢迎新的机会和交流。无论您有问题、项目想法，还是只想打个招呼——请随时联系我。",
      cta: "打个招呼",
    },
    footer: {
      rights: "版权所有。",
      builtWith: "使用 React 和 Tailwind CSS 构建",
    },
  },

  fr: {
    nav: {
      about: "À propos",
      experience: "Expérience",
      projects: "Projets",
      photography: "Photographie",
      contact: "Contact",
    },
    hero: {
      greeting: "Bonjour, je suis",
      name: "remker1",
      title: "Développeur logiciel & Photographe",
      description:
        "Diplômé en informatique de l'Université de la Saskatchewan. Je développe des logiciels le jour et capture des moments à travers l'objectif pendant mon temps libre.",
      viewWork: "Voir mes travaux",
      getInTouch: "Me contacter",
    },
    about: {
      heading: "À propos de moi",
      bio1: "Je suis diplômé en informatique de l'",
      university: "Université de la Saskatchewan",
      bio1End:
        ", passionné par la création de logiciels propres et fonctionnels. J'aime travailler sur l'ensemble de la pile — de la conception d'interfaces utilisateur intuitives à la construction de systèmes backend robustes.",
      bio2: "En dehors du code, la photographie est mon exutoire créatif. J'aime explorer le monde à travers un objectif, capturer des paysages, des scènes de rue et des moments du quotidien qui racontent une histoire.",
      techHeading: "Technologies et outils",
    },
    experience: {
      heading: "Expérience",
      roles: [
        {
          title: "Technicien informatique",
          company: "Uniway Computers",
          period: "Actuel",
          description:
            "Diagnostic et réparation de problèmes matériels et logiciels. Support technique et assemblage de systèmes PC personnalisés pour les clients. Gestion des stocks et assurance de la qualité du service.",
        },
        {
          title: "Stagiaire développeur full stack",
          company: "GridLabel",
          period: "Stage",
          description:
            "Développement et maintenance d'applications web full-stack. Utilisation de frameworks et outils modernes pour livrer des fonctionnalités côté frontend et backend. Collaboration avec l'équipe sur le développement produit et les revues de code.",
        },
      ],
    },
    projects: {
      heading: "Projets",
      items: [
        {
          title: "RenoMana",
          description:
            "Projet scolaire CMPT 370 : une plateforme de gestion de rénovation pour petites entreprises. Elle couvre la planification des projets, le suivi des stocks et des affectations d'employés, ainsi que les demandes clients et les avis, avec une app JavaFX et un backend Flask + MongoDB.",
          tags: ["Java", "JavaFX", "Flask", "MongoDB", "Docker"],
        },
        {
          title: "USask GPA Estimator",
          description:
            "Un calculateur de GPA non officiel qui analyse les relevés de notes PDF non officiels de l'USask pour estimer rapidement la situation académique. Il permet de modifier les notes, d'ajouter des cours futurs et de gérer les reprises en conservant la note la plus récente.",
          tags: ["Python", "Tkinter", "PDF Parsing", "Data Processing"],
        },
      ],
    },
    photography: {
      heading: "Photographie",
      description:
        "La photographie est mon échappatoire créative. J'aime capturer des paysages, des scènes de rue et des moments spontanés. Voici quelques-uns de mes favoris.",
      viewGallery: "Voir la galerie complète",
    },
    gallery: {
      heading: "Galerie photo",
      description:
        "Une collection de moments capturés à travers mon objectif. Paysages, photographie de rue et scènes du quotidien qui ont attiré mon regard.",
      backHome: "Retour à l'accueil",
    },
    contact: {
      heading: "Me contacter",
      description:
        "Je suis toujours ouvert aux nouvelles opportunités et conversations. Que vous ayez une question, une idée de projet ou simplement envie de dire bonjour — n'hésitez pas à me contacter.",
      cta: "Dire bonjour",
    },
    footer: {
      rights: "Tous droits réservés.",
      builtWith: "Construit avec React et Tailwind CSS",
    },
  },
};

export default translations;
