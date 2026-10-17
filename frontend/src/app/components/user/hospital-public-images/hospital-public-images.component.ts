import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { HospitalProfileService, HospitalImageSlot } from '../../../services/hospital-profile.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-hospital-public-images',
  imports: [CommonModule, RouterModule],
  templateUrl: './hospital-public-images.component.html',
  styleUrl: './hospital-public-images.component.css'
})
export class HospitalPublicImagesComponent implements OnInit {
  user: User | null = null;
  readonly apiHost = environment.apiHost;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  readonly imageRules = {
    logo: {
      label: 'Profile / Logo',
      description: 'Shown next to your hospital name on the public listing.',
      maxSizeLabel: '2 MB',
      dimensionsLabel: '200×200px – 2048×2048px',
      aspectLabel: 'square (about 1:1)',
      accept: 'image/jpeg,image/png,image/webp'
    },
    banner: {
      label: 'Banner',
      description: 'Wide hero image shown on your public detail page.',
      maxSizeLabel: '5 MB',
      dimensionsLabel: '1200×300px – 3840×1440px',
      aspectLabel: 'wide (between 2:1 and 6:1)',
      accept: 'image/jpeg,image/png,image/webp'
    }
  };

  imageBusy: { logo: boolean; banner: boolean } = { logo: false, banner: false };
  imageError: { logo: string; banner: string } = { logo: '', banner: '' };
  readonly imageSlots: Array<HospitalImageSlot> = ['logo', 'banner'];

  constructor(
    private authService: AuthService,
    private hospitalProfileService: HospitalProfileService
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load user profile';
      }
    });
  }

  get profileImageUrl(): string | null {
    return this.buildImageUrl(this.user?.hospitalProfile?.profileImageUrl);
  }

  get profileImagePublished(): boolean {
    return !!this.user?.hospitalProfile?.profileImagePublished;
  }

  get bannerImageUrl(): string | null {
    return this.buildImageUrl(this.user?.hospitalProfile?.bannerImageUrl);
  }

  get bannerImagePublished(): boolean {
    return !!this.user?.hospitalProfile?.bannerImagePublished;
  }

  hasImage(slot: HospitalImageSlot): boolean {
    return slot === 'logo' ? !!this.profileImageUrl : !!this.bannerImageUrl;
  }

  isImagePublished(slot: HospitalImageSlot): boolean {
    return slot === 'logo' ? this.profileImagePublished : this.bannerImagePublished;
  }

  imageStatusBadgeClass(slot: HospitalImageSlot): string {
    if (!this.hasImage(slot)) return 'badge bg-secondary';
    return this.isImagePublished(slot) ? 'badge bg-success' : 'badge bg-secondary';
  }

  imageStatusLabel(slot: HospitalImageSlot): string {
    if (!this.hasImage(slot)) return 'Not uploaded';
    return this.isImagePublished(slot) ? 'Published — Visible publicly' : 'Unpublished — Hidden from public pages';
  }

  private buildImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `${this.apiHost}${url}`;
  }

  onPublicImageSelected(slot: HospitalImageSlot, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.imageError[slot] = '';
    this.imageBusy[slot] = true;
    this.error = '';

    this.hospitalProfileService.uploadPublicImage(slot, file).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, {
          url: response?.data?.url,
          published: !!response?.data?.published
        });
        this.success = response?.message || 'Image uploaded. Turn on Publish when you are ready.';
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        this.imageError[slot] = err.error?.message || 'Image upload failed. Please try again.';
      }
    });
  }

  removePublicImage(slot: HospitalImageSlot): void {
    this.imageError[slot] = '';
    this.imageBusy[slot] = true;
    this.error = '';

    this.hospitalProfileService.removePublicImage(slot).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, { url: null, published: false });
        this.success = response?.message || 'Image removed.';
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        this.imageError[slot] = err.error?.message || 'Failed to remove image.';
      }
    });
  }

  togglePublicImagePublished(slot: HospitalImageSlot, event: Event): void {
    const desired = (event.target as HTMLInputElement).checked;
    this.imageError[slot] = '';
    this.imageBusy[slot] = true;
    this.error = '';

    this.hospitalProfileService.setPublicImagePublished(slot, desired).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, {
          url: slot === 'logo' ? this.user?.hospitalProfile?.profileImageUrl ?? null : this.user?.hospitalProfile?.bannerImageUrl ?? null,
          published: !!response?.data?.published
        });
        this.success = response?.message || (desired ? 'Image published.' : 'Image unpublished.');
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        (event.target as HTMLInputElement).checked = !desired;
        this.imageError[slot] = err.error?.message || 'Failed to update publish state.';
      }
    });
  }

  private patchImageSlot(
    slot: HospitalImageSlot,
    update: { url: string | null; published: boolean }
  ): void {
    if (!this.user) return;
    const profile = this.user.hospitalProfile || {};
    const patched = { ...profile } as any;
    if (slot === 'logo') {
      patched.profileImageUrl = update.url;
      patched.profileImagePublished = update.published;
      patched.profileImageUploadedAt = update.url ? new Date().toISOString() : null;
    } else {
      patched.bannerImageUrl = update.url;
      patched.bannerImagePublished = update.published;
      patched.bannerImageUploadedAt = update.url ? new Date().toISOString() : null;
    }
    this.user = { ...this.user, hospitalProfile: patched };
    this.authService.setCurrentUser(this.user);
  }
}
