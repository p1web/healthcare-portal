import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface StatCard {
  title: string;
  period: string;
  value: string;
  delta: string;
  deltaLabel: string;
  deltaClass: 'text-success' | 'text-danger' | 'text-muted';
  icon: string;
  variant: 'patients' | 'doctors' | 'hospitals' | 'appointments';
  link: string;
}

interface StatusBar {
  label: string;
  count: number;
  percent: number;
  colorClass: string;
}

interface RecentAppointment {
  id: string;
  patient: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

interface TopDoctor {
  name: string;
  initials: string;
  specialty: string;
  hospital: string;
  appointments: number;
  rating: number;
  avatarClass: string;
}

interface ActivityItem {
  timeLabel: string;
  badgeClass: string;
  html: string;
}

interface PendingReview {
  name: string;
  role: 'Doctor' | 'Hospital';
  submitted: string;
  link: string;
  initials: string;
  avatarClass: string;
}

interface Announcement {
  title: string;
  summary: string;
  date: string;
  tag: string;
  tagClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  stats: StatCard[] = [
    {
      title: 'Total Patients',
      period: 'Registered',
      value: '1,248',
      delta: '+8.2%',
      deltaLabel: 'vs last month',
      deltaClass: 'text-success',
      icon: 'bi bi-person-heart',
      variant: 'patients',
      link: '/admin/users/patients'
    },
    {
      title: 'Verified Doctors',
      period: 'Active providers',
      value: '84',
      delta: '+3',
      deltaLabel: 'new this week',
      deltaClass: 'text-success',
      icon: 'bi bi-clipboard2-pulse',
      variant: 'doctors',
      link: '/admin/public-doctors'
    },
    {
      title: 'Verified Hospitals',
      period: 'Published',
      value: '27',
      delta: '+1',
      deltaLabel: 'this month',
      deltaClass: 'text-success',
      icon: 'bi bi-hospital',
      variant: 'hospitals',
      link: '/admin/public-hospitals'
    },
    {
      title: 'Appointments',
      period: 'This month',
      value: '342',
      delta: '+15.4%',
      deltaLabel: 'vs last month',
      deltaClass: 'text-success',
      icon: 'bi bi-calendar2-check',
      variant: 'appointments',
      link: '/admin/appointments'
    }
  ];

  appointmentStatusTotal = 342;
  appointmentStatus: StatusBar[] = [
    { label: 'Confirmed', count: 198, percent: 58, colorClass: 'bg-success' },
    { label: 'Pending',   count: 74,  percent: 22, colorClass: 'bg-warning' },
    { label: 'Completed', count: 52,  percent: 15, colorClass: 'bg-primary' },
    { label: 'Cancelled', count: 18,  percent: 5,  colorClass: 'bg-danger'  }
  ];

  recentAppointments: RecentAppointment[] = [
    { id: 'AP-10248', patient: 'Aarav Sharma',   doctor: 'Dr. Priya Menon',    specialty: 'Cardiology',    date: 'Aug 25, 2026', time: '10:30 AM', status: 'Confirmed' },
    { id: 'AP-10247', patient: 'Isha Verma',     doctor: 'Dr. Rohan Kapoor',   specialty: 'Dermatology',   date: 'Aug 25, 2026', time: '11:15 AM', status: 'Pending'   },
    { id: 'AP-10246', patient: 'Neel Patel',     doctor: 'Dr. Anjali Rao',     specialty: 'Pediatrics',    date: 'Aug 25, 2026', time: '12:00 PM', status: 'Completed' },
    { id: 'AP-10245', patient: 'Meera Iyer',     doctor: 'Dr. Vikram Singh',   specialty: 'Orthopedics',   date: 'Aug 24, 2026', time: '04:45 PM', status: 'Confirmed' },
    { id: 'AP-10244', patient: 'Kabir Khanna',   doctor: 'Dr. Sneha Reddy',    specialty: 'Neurology',     date: 'Aug 24, 2026', time: '02:20 PM', status: 'Cancelled' },
    { id: 'AP-10243', patient: 'Ananya Gupta',   doctor: 'Dr. Aditya Bhat',    specialty: 'ENT',           date: 'Aug 24, 2026', time: '11:00 AM', status: 'Completed' }
  ];

  topDoctors: TopDoctor[] = [
    { name: 'Dr. Priya Menon',  initials: 'PM', specialty: 'Cardiology',   hospital: 'City General Hospital',  appointments: 128, rating: 4.9, avatarClass: 'avatar-blue'   },
    { name: 'Dr. Rohan Kapoor', initials: 'RK', specialty: 'Dermatology',  hospital: 'Sunrise Multi-Specialty', appointments: 112, rating: 4.8, avatarClass: 'avatar-green'  },
    { name: 'Dr. Anjali Rao',   initials: 'AR', specialty: 'Pediatrics',   hospital: 'Little Star Children\'s',  appointments: 96,  rating: 4.9, avatarClass: 'avatar-orange' },
    { name: 'Dr. Vikram Singh', initials: 'VS', specialty: 'Orthopedics',  hospital: 'MediCare Institute',       appointments: 84,  rating: 4.7, avatarClass: 'avatar-purple' },
    { name: 'Dr. Sneha Reddy',  initials: 'SR', specialty: 'Neurology',    hospital: 'City General Hospital',   appointments: 71,  rating: 4.8, avatarClass: 'avatar-teal'   }
  ];

  recentActivity: ActivityItem[] = [
    { timeLabel: '10 min',  badgeClass: 'text-success', html: 'New patient <span class="fw-bold text-dark">Ananya Gupta</span> registered' },
    { timeLabel: '42 min',  badgeClass: 'text-primary', html: 'Appointment <span class="fw-bold text-dark">AP-10248</span> confirmed with Dr. Priya Menon' },
    { timeLabel: '2 hrs',   badgeClass: 'text-info',    html: '<span class="fw-bold text-dark">Dr. Rohan Kapoor</span> submitted profile for verification' },
    { timeLabel: '5 hrs',   badgeClass: 'text-warning', html: '<span class="fw-bold text-dark">Sunrise Multi-Specialty</span> requested changes on hospital profile' },
    { timeLabel: '1 day',   badgeClass: 'text-success', html: 'Hospital <span class="fw-bold text-dark">MediCare Institute</span> approved and published' },
    { timeLabel: '2 days',  badgeClass: 'text-danger',  html: 'Appointment <span class="fw-bold text-dark">AP-10231</span> was cancelled by patient' },
    { timeLabel: '3 days',  badgeClass: 'text-muted',   html: 'Coupon <span class="fw-bold text-dark">HEALTH20</span> created for consultations' }
  ];

  pendingReviews: PendingReview[] = [
    { name: 'Dr. Neha Iyer',           role: 'Doctor',   submitted: '2 hours ago', link: '/admin/public-doctors',   initials: 'NI', avatarClass: 'avatar-blue'   },
    { name: 'Dr. Karan Malhotra',      role: 'Doctor',   submitted: '5 hours ago', link: '/admin/public-doctors',   initials: 'KM', avatarClass: 'avatar-orange' },
    { name: 'Green Valley Hospital',   role: 'Hospital', submitted: '1 day ago',   link: '/admin/public-hospitals', initials: 'GV', avatarClass: 'avatar-green'  },
    { name: 'Dr. Sana Qureshi',        role: 'Doctor',   submitted: '2 days ago',  link: '/admin/public-doctors',   initials: 'SQ', avatarClass: 'avatar-purple' },
    { name: 'Metro Care Multi-Speciality', role: 'Hospital', submitted: '3 days ago', link: '/admin/public-hospitals', initials: 'MC', avatarClass: 'avatar-teal'   }
  ];

  announcements: Announcement[] = [
    { title: 'Tele-consultation module rollout',    summary: 'Video consultation goes live for verified doctors starting September.',            date: 'Aug 24, 2026', tag: 'Product',     tagClass: 'badge bg-primary' },
    { title: 'New specialty: Endocrinology added',  summary: 'Doctors can now onboard under the Endocrinology specialty from the profile page.', date: 'Aug 22, 2026', tag: 'Specialty',   tagClass: 'badge bg-success' },
    { title: 'Coupon HEALTH20 launched',            summary: '20% off on first consultation. Valid across all verified hospitals until Dec 31.',  date: 'Aug 20, 2026', tag: 'Marketing',   tagClass: 'badge bg-warning text-dark' },
    { title: 'Verification SLA reduced to 48 hrs',  summary: 'Provider verification turnaround has been tightened to two business days.',        date: 'Aug 18, 2026', tag: 'Operations',  tagClass: 'badge bg-info text-dark' }
  ];

  ratingStars(rating: number): { full: number[]; hasHalf: boolean; empty: number[] } {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const emptyCount = 5 - full - (hasHalf ? 1 : 0);
    return {
      full: Array(full).fill(0),
      hasHalf,
      empty: Array(Math.max(0, emptyCount)).fill(0)
    };
  }

  statusBadgeClass(status: RecentAppointment['status']): string {
    switch (status) {
      case 'Confirmed': return 'badge bg-success';
      case 'Pending':   return 'badge bg-warning text-dark';
      case 'Completed': return 'badge bg-primary';
      case 'Cancelled': return 'badge bg-danger';
    }
  }
}
