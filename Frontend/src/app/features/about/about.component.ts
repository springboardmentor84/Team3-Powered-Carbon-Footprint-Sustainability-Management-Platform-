import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  public coreValues = [
    {
      icon: 'bi-flower1',
      title: 'Sustainability First',
      desc: 'Our primary goal is reducing global emissions. Every feature we build serves environmental recovery.'
    },
    {
      icon: 'bi-cpu',
      title: 'AI Innovation',
      desc: 'We utilize advanced predictive models and recommendations to optimize carbon offsets in real-time.'
    },
    {
      icon: 'bi-shield-check',
      title: 'Data Integrity',
      desc: 'Accurate carbon auditing requires transparent calculations. We uphold strict data validation protocols.'
    },
    {
      icon: 'bi-people',
      title: 'Community Driven',
      desc: 'Individual habits accumulate into global changes. We create gamified features to connect and empower.'
    }
  ];

  public architectureLayers = [
    {
      layer: 'Web & Mobile Frontend',
      tech: 'Angular 19, RxJS, Modern Glassmorphism CSS',
      desc: 'Responsive web interface for individuals and organization lead dashboards.'
    },
    {
      layer: 'API Gateway & Auth',
      tech: 'Spring Security, JWT Authentication, OAuth2',
      desc: 'Role-based authorization (USER, ADMIN, ORGANIZATION) and rate limiting.'
    },
    {
      layer: 'Microservices & AI Engine',
      tech: 'Spring Boot 3, Spring Data JPA, OpenAI API',
      desc: '11-category calculation engine, AI recommendations, and gamification.'
    },
    {
      layer: 'Core Data Layer',
      tech: 'PostgreSQL Database, Hibernate ORM',
      desc: 'Relational data storage for activities, users, challenges, and audit logs.'
    }
  ];

  public milestoneOverview = [
    {
      milestone: 'Milestone 1 (Week 1 & 2)',
      title: 'Requirements, Database Design & Backend Setup',
      status: 'Completed',
      tasks: 'Database schema (users, profiles, carbon_entries, goals, challenges), Spring Boot setup, PostgreSQL config, JWT Auth.'
    },
    {
      milestone: 'Milestone 2 (Week 3 & 4)',
      title: 'Carbon Tracking & Goal Management',
      status: 'Completed',
      tasks: '11-category calculation engine, goal creation & tracking, sustainability dashboard.'
    },
    {
      milestone: 'Milestone 3 (Week 5 & 6)',
      title: 'AI Recommendations & Community Challenges',
      status: 'Completed',
      tasks: 'AI recommendation engine, community eco-challenges, leaderboards & rewards.'
    },
    {
      milestone: 'Milestone 4 (Week 7 & 8)',
      title: 'Analytics, Testing & Deployment',
      status: 'Completed',
      tasks: 'Global analytics dashboard, PDF/Excel reports export, production deployment.'
    }
  ];
}
