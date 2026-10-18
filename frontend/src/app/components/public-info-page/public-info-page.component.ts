import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface InfoSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  id?: string;
}

interface InfoPage {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoSection[];
  callToAction?: {
    heading: string;
    description: string;
    label: string;
    route: string;
  };
}

const pages: Record<string, InfoPage> = {
  about: {
    eyebrow: 'About TooSmartCare',
    title: 'Care starts with a clearer next step.',
    intro: 'TooSmartCare brings healthcare discovery and appointment tools together, helping people find doctors and hospitals and take the next step with confidence.',
    sections: [
      {
        heading: 'Our purpose',
        paragraphs: [
          'Finding the right care can involve a lot of searching and coordination. We make it easier to explore provider information, compare options and manage appointments in one place.'
        ]
      },
      {
        heading: 'What you can do',
        paragraphs: ['Use TooSmartCare to find healthcare providers and access convenient tools for your care journey.'],
        bullets: [
          'Explore doctors, hospitals and available services.',
          'Review provider profiles and appointment availability.',
          'Request and keep track of bookings through your account.',
          'Find offers that may be available for eligible services.'
        ]
      },
      {
        heading: 'Our role',
        paragraphs: [
          'TooSmartCare is a technology platform that helps patients connect with independent healthcare providers. Medical advice, diagnosis, treatment and care are provided by the doctor or hospital you choose. The platform is not a substitute for professional medical advice or emergency care.'
        ]
      }
    ]
  },
  partners: {
    eyebrow: 'For healthcare providers',
    title: 'Partner with TooSmartCare.',
    intro: 'Make it easier for patients to discover your services and connect with your practice through TooSmartCare.',
    sections: [
      {
        heading: 'Who can partner',
        paragraphs: [
          'Doctors, clinics and hospitals can apply to join the platform. Provider profiles and available tools may vary based on the services offered and approval requirements.'
        ]
      },
      {
        heading: 'Getting started',
        paragraphs: ['The onboarding process begins with a provider registration. Our team may request supporting details before a listing or account is approved.'],
        bullets: [
          'Create an account and select the relevant provider type.',
          'Submit your professional, facility and contact details.',
          'Complete any verification steps requested by our team.',
          'Keep your profile, services and availability up to date.'
        ]
      },
      {
        heading: 'Working together',
        paragraphs: [
          'Partners are responsible for the accuracy of their information, the care they provide, and managing appointments in accordance with applicable requirements. A registration request does not guarantee approval or platform placement.'
        ]
      }
    ],
    callToAction: {
      heading: 'Ready to get started?',
      description: 'Register your practice or facility to begin the onboarding process.',
      label: 'Start registration',
      route: '/register'
    }
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    intro: 'These terms apply when you access or use the TooSmartCare website, account features and booking services. Please read them before using the platform.',
    sections: [
      {
        heading: 'Using TooSmartCare',
        paragraphs: [
          'TooSmartCare provides online tools to discover independent healthcare providers and request or manage appointments. By using the platform, you agree to use it lawfully and in accordance with these terms.'
        ]
      },
      {
        heading: 'Accounts and information',
        paragraphs: [
          'You are responsible for providing accurate account information and keeping your sign-in credentials secure. Please notify us if you believe your account has been accessed without permission.'
        ]
      },
      {
        heading: 'Appointments and providers',
        paragraphs: [
          'Doctors and hospitals listed on TooSmartCare are independent providers. Appointment requests may require confirmation. Provider services, availability, prices and cancellation policies are determined by the provider and any applicable details shown during booking.'
        ]
      },
      {
        heading: 'Payments and offers',
        paragraphs: [
          'Any applicable charges and payment details are presented as part of the booking process. Offers or coupons may have eligibility requirements, limits or expiry dates, which will be shown with the offer.'
        ]
      },
      {
        heading: 'Medical and emergency care',
        paragraphs: [
          'Information on the platform is not medical advice. TooSmartCare does not diagnose conditions or provide treatment. Contact a qualified healthcare professional for medical guidance. Do not use the platform for emergencies; contact your local emergency services.'
        ]
      },
      {
        heading: 'Responsible use and availability',
        paragraphs: [
          'Do not misuse the platform, interfere with its operation, submit misleading information or access another person’s account without permission. We may update or suspend features to maintain or improve the service.'
        ]
      },
      {
        heading: 'Changes and questions',
        paragraphs: [
          'We may revise these terms as the platform changes. Updated terms will be published on this page. Continued use of the platform after an update means you accept the revised terms.'
        ]
      }
    ]
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    intro: 'This policy describes how TooSmartCare handles information when you use our website, create an account or use our booking services.',
    sections: [
      {
        heading: 'Information we handle',
        paragraphs: [
          'Depending on how you use the platform, information may include account and contact details, appointment and provider selections, messages sent to support, and health information you choose to provide. We may also receive basic device and usage information needed to operate and protect the service.'
        ]
      },
      {
        heading: 'How information is used',
        paragraphs: [
          'We use information to provide account and booking features, coordinate appointment requests, respond to support enquiries, communicate service updates, protect the platform and meet applicable legal obligations.'
        ]
      },
      {
        heading: 'When information is shared',
        paragraphs: [
          'Information relevant to an appointment may be shared with the doctor or hospital you select so they can respond to or provide the requested service. We may also use service providers that help operate the platform, or disclose information when required by law or necessary to protect users and the service.'
        ]
      },
      {
        heading: 'Security and retention',
        paragraphs: [
          'We use reasonable safeguards designed to protect information. No online service can guarantee absolute security. We retain information for as long as needed to provide the service and meet applicable operational or legal requirements.'
        ]
      },
      {
        heading: 'Your choices',
        paragraphs: [
          'You can review and update certain account details through your account. For questions or requests about personal information, contact us using the details below. We will handle requests in accordance with applicable requirements.'
        ]
      },
      {
        heading: 'Cookies and similar technologies',
        paragraphs: [
          'The website may use cookies or similar technologies to support core functionality, remember preferences and understand how the service is used. You can manage cookies through your browser settings; disabling them may affect some features.',
        ],
        id: 'cookies'
      }
    ]
  }
};

@Component({
  selector: 'app-public-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-info-page.component.html',
  styleUrls: ['./public-info-page.component.css']
})
export class PublicInfoPageComponent {
  constructor(private route: ActivatedRoute) {}

  get page(): InfoPage {
    const pageKey = this.route.snapshot.data['pageKey'] as string;
    return pages[pageKey] ?? pages['about'];
  }
}