/**
 * @fileoverview About page type definitions for Homepage API
 */

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

export interface ProfileData {
  name: string;
  tagline: string;
  location: string;
  bio: string[];
  avatarUrl?: string;
  social: SocialLinks;
}

export type SectionType = 'skills' | 'interests' | 'experience' | 'education' | 'custom';
export type SectionSize = 'small' | 'medium' | 'large';
export type SkillLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  name: string;
  level: SkillLevel;
  category?: string;
}

export interface SkillsContent {
  skills: Skill[];
}

export interface Interest {
  emoji: string;
  label: string;
}

export interface InterestsContent {
  interests: Interest[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface ExperienceContent {
  items: ExperienceItem[];
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
  description: string;
}

export interface EducationContent {
  items: EducationItem[];
}

export interface CustomContent {
  html: string;
}

export type SectionContent = SkillsContent | InterestsContent | ExperienceContent | EducationContent | CustomContent;

export interface AboutSection {
  id: string;
  type: SectionType;
  title: string;
  icon?: string;
  order: number;
  size: SectionSize;
  content: SectionContent;
}

export interface AboutData {
  profile: ProfileData;
  sections: AboutSection[];
}

export interface UpdateAboutDto {
  profile?: Partial<ProfileData>;
  sections?: AboutSection[];
}

export interface UpdateSectionsOrderDto {
  sections: { id: string; order: number }[];
}
