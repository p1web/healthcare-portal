import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const jQuery: any;
declare const $: any;

interface Select2Option { id: number | string; text: string; }

@Directive({
  selector: '[appSelect2]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Select2Directive),
    multi: true
  }]
})
export class Select2Directive implements AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input() options: Select2Option[] = [];
  @Input() multiple = false;
  @Input() placeholder = 'Select...';
  @Input() allowClear = true;

  private $el: any;
  private initialized = false;
  private pendingValue: any = null;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLSelectElement>) {}

  ngAfterViewInit(): void {
    const jq = (window as any).jQuery || (window as any).$;
    if (!jq) {
      console.error('Select2Directive: jQuery is not available on window');
      return;
    }
    this.$el = jq(this.elementRef.nativeElement);
    this.render();
    this.$el.on('change', () => {
      const val = this.$el.val();
      this.onChange(val);
      this.onTouched();
    });
    this.initialized = true;
    if (this.pendingValue !== null) {
      this.writeValue(this.pendingValue);
      this.pendingValue = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && changes['options']) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    if (this.$el && this.$el.data('select2')) {
      this.$el.off('change');
      this.$el.select2('destroy');
    }
  }

  private render(): void {
    if (!this.$el) return;
    if (this.$el.data('select2')) {
      this.$el.select2('destroy');
    }
    // Rebuild <option> list from bound options
    this.$el.empty();
    this.options.forEach(opt => {
      const optionEl = new Option(opt.text, String(opt.id), false, false);
      this.$el.append(optionEl);
    });
    this.$el.select2({
      multiple: this.multiple,
      placeholder: this.placeholder,
      allowClear: this.allowClear,
      width: '100%'
    });
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    if (!this.initialized) {
      this.pendingValue = value;
      return;
    }
    const val = this.multiple
      ? (Array.isArray(value) ? value.map(v => String(v)) : [])
      : (value !== null && value !== undefined ? String(value) : null);
    this.$el.val(val).trigger('change.select2');
  }

  registerOnChange(fn: (value: any) => void): void {
    // Wrap to convert values back to number when applicable
    this.onChange = (raw) => {
      if (this.multiple) {
        const arr: string[] = Array.isArray(raw) ? raw : [];
        fn(arr.map(v => this.coerce(v)));
      } else {
        fn(raw === null || raw === undefined ? null : this.coerce(raw));
      }
    };
  }

  private coerce(v: string): number | string {
    const n = Number(v);
    return isNaN(n) || v.trim() === '' ? v : n;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.$el) this.$el.prop('disabled', isDisabled).trigger('change.select2');
  }
}
