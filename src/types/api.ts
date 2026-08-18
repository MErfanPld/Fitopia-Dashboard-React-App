export type StaffRole = 'owner' | 'manager' | 'receptionist' | 'accountant' | 'coach' | 'staff';
export type PermissionCode =
  | 'customer.view' | 'customer.create' | 'customer.update' | 'customer.delete'
  | 'course.view' | 'course.create' | 'course.update' | 'course.enroll'
  | 'attendance.view' | 'attendance.create'
  | 'finance.view' | 'finance.create' | 'finance.update' | 'finance.report' | 'finance.refund'
  | 'employee.view' | 'employee.manage' | 'offering.manage';

export const ROLE_DEFAULTS: Record<StaffRole, PermissionCode[]> = {
  owner: ['customer.view','customer.create','customer.update','customer.delete','course.view','course.create','course.update','course.enroll','attendance.view','attendance.create','finance.view','finance.create','finance.update','finance.report','finance.refund','employee.view','employee.manage','offering.manage'],
  manager: ['customer.view','customer.create','customer.update','course.view','course.create','course.update','course.enroll','attendance.view','attendance.create','finance.view','finance.create','finance.report','employee.view','offering.manage'],
  receptionist: ['customer.view','customer.create','customer.update','course.view','course.enroll','attendance.view','attendance.create','finance.create'],
  accountant: ['customer.view','finance.view','finance.create','finance.update','finance.report','finance.refund'],
  coach: ['customer.view','course.view','course.update','attendance.view','attendance.create'],
  staff: ['customer.view','attendance.view','attendance.create'],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'مالک', manager: 'مدیر', receptionist: 'پذیرش', accountant: 'حسابدار', coach: 'مربی', staff: 'کارمند',
};

export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  'customer.view': 'مشاهده مشتری', 'customer.create': 'ایجاد مشتری', 'customer.update': 'ویرایش مشتری', 'customer.delete': 'حذف مشتری',
  'course.view': 'مشاهده دوره', 'course.create': 'ایجاد دوره', 'course.update': 'ویرایش دوره', 'course.enroll': 'ثبت‌نام در دوره',
  'attendance.view': 'مشاهده حضور', 'attendance.create': 'ثبت حضور',
  'finance.view': 'مشاهده مالی', 'finance.create': 'ثبت مالی', 'finance.update': 'ویرایش مالی', 'finance.report': 'گزارش مالی', 'finance.refund': 'استرداد',
  'employee.view': 'مشاهده کارمند', 'employee.manage': 'مدیریت کارمند', 'offering.manage': 'مدیریت رشته‌ها',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionCode[];

export interface GymAccess { id: number; gym: number; gym_name: string; gym_address?: string; role: StaffRole | string; }
export interface AuthUser { id?: number; username?: string; full_name?: string; phone?: string; phone_number?: string; }
export interface LoginResponse {
  tokens?: { access: string; refresh?: string };
  access?: string; refresh?: string; user?: AuthUser; gyms?: GymAccess[];
}

export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'inactive';
export type MembershipType = 'session_pack' | 'monthly' | 'course' | 'drop_in' | string;
export type MemberSource = 'token' | 'manual' | string;

export interface GymMember {
  id: number;
  gym?: number;
  fitopia_user?: number | null;
  full_name: string;
  phone: string;
  sport: number | null;
  sport_name?: string;
  coach?: number | null;
  coach_name?: string | null;
  source?: MemberSource;
  added_by?: number | null;
  added_by_name?: string | null;
  sessions_total?: number | null;
  sessions_remaining?: number | null;
  sessions_used?: number | null;
  price_paid?: number | null;
  join_date: string;
  photo?: string | null;
  membership_status?: MembershipStatus | string;
  membership_type?: MembershipType;
  membership_start?: string | null;
  membership_end?: string | null;
  notes?: string | null;
  is_active?: boolean;
  last_visit_at?: string | null;
  sessions_remaining_calc?: string | number | null;
  is_fitopia_user?: boolean | string;
  created_at?: string;
  updated_at?: string;
}
export type GymCustomer = GymMember;

export interface GymMemberInput {
  fitopia_user?: number | null;
  full_name: string;
  phone: string;
  sport?: number | null;
  coach?: number | null;
  source?: MemberSource;
  sessions_total?: number | null;
  sessions_remaining?: number | null;
  sessions_used?: number | null;
  price_paid?: number | null;
  join_date: string;
  photo?: string | null;
  membership_status?: MembershipStatus | string;
  membership_type?: MembershipType;
  membership_start?: string | null;
  membership_end?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface GymCoach { id: number; full_name: string; image?: string | null; specialty?: string; sports?: number[]; }
export interface GymCoachInput { full_name: string; specialty?: string; sports?: number[]; image?: File | null; }

export interface StaffEmployee {
  id: number; user: number; username?: string; user_phone?: string; gym?: number;
  role: StaffRole | string; is_active: boolean; start_date?: string | null; end_date?: string | null;
  employee_number?: string; permission_codes?: string[] | string; created_at?: string;
}
export interface StaffEmployeeInput {
  user?: number; role: StaffRole | string; is_active?: boolean;
  start_date?: string | null; end_date?: string | null; employee_number?: string;
}

/** OpenAPI: DayOfWeekEnum — 0=شنبه … 6=جمعه */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** OpenAPI: SkillLevelEnum */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
/** OpenAPI: GenderRestrictionEnum */
export type GenderRestriction = 'all' | 'male' | 'female';

export interface OfferingSchedule {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface GymOffering {
  id: number;
  gym?: number;
  sport: number | null;
  sport_name?: string;
  description?: string;
  coaches?: number[];
  capacity?: number | null;
  single_session_price?: number | null;
  course_price?: number | null;
  monthly_price?: number | null;
  duration_minutes?: number | null;
  skill_level?: SkillLevel | string;
  gender_restriction?: GenderRestriction | string;
  min_age?: number | null;
  max_age?: number | null;
  is_active?: boolean;
  schedules?: OfferingSchedule[];
  created_at?: string;
  updated_at?: string;
}

export interface GymOfferingInput {
  sport: number | null;
  description?: string;
  coaches?: number[];
  capacity?: number | null;
  single_session_price?: number | null;
  course_price?: number | null;
  monthly_price?: number | null;
  duration_minutes?: number | null;
  skill_level?: SkillLevel | string;
  gender_restriction?: GenderRestriction | string;
  min_age?: number | null;
  max_age?: number | null;
  is_active?: boolean;
  schedules?: OfferingSchedule[];
}
export interface Course {
  id: number; title: string; sport?: number | null; sport_name?: string; offering?: number | null; coach?: number | null;
  description?: string; start_date?: string; end_date?: string; start_time?: string | null; end_time?: string | null;
  days_of_week?: string; capacity?: number | null; price?: number | null; status?: string; is_active?: boolean;
  enrollment_count?: number; remaining_capacity?: number;
}
export interface GymVisit {
  id: number; customer?: number | null; customer_name?: string; guest_name?: string; guest_phone?: string;
  check_in_at?: string | null; check_out_at?: string | null; is_open?: boolean; method?: string; source?: string;
  price?: number; sport?: number | null; created_at?: string;
}
export interface AttendanceStats { today_visits: number; currently_inside: number; month_visits: number; total_visits: number; }

export interface GymPrice {
  id: number; sport: number; sport_name: string; session_price?: number | null;
  monthly_price: number; quarterly_price?: number | null; yearly_price: number;
}
export interface GymPriceInput {
  sport: number; session_price?: number | null; monthly_price: number;
  quarterly_price?: number | null; yearly_price: number;
}
export interface SuggestNewSportInput { name: string; category_id: number; }
export interface SportCategory { id: number; name: string; }
export interface Sport { id: number; name: string; category?: number | null; category_name?: string; }

export interface FinanceTransaction {
  id: number; type?: string; amount: number; category?: string; description?: string;
  payment_method?: string; status?: string; customer?: number | null; reference_number?: string;
  date?: string; created_at?: string;
}
export interface CustomerPayment {
  id: number; customer: number; total_price: number; amount_paid: number; discount?: number;
  remaining_balance?: number; description?: string; payment_method?: string; reference_number?: string; created_at?: string;
}
export interface Refund {
  id: number; original_transaction: number; amount: number; reason?: string; status?: string;
  created_at?: string; completed_at?: string | null;
}
export interface FinanceReport {
  daily: { income: number; expense: number; net: number };
  monthly: { income: number; expense: number; net: number };
  income_by_category?: { category: string; total: number }[];
  outstanding_balances?: { customer_id: number; customer_name: string; remaining: number; payment_id: number }[];
}
export interface SingleSession {
  id: number; customer: number; sport?: number | null; price: number; status?: string;
  purchased_at?: string; used_at?: string | null; expires_at?: string | null;
}
export interface AuditLog {
  id: number; user?: number | null; user_name?: string | null; action: string;
  object_type?: string; object_id?: string; object_repr?: string | null;
  metadata?: Record<string, unknown>; created_at?: string;
}
export interface GymChangeRequest {
  id: number; request_type: string; status: string; payload?: Record<string, unknown>;
  admin_note?: string; created_at?: string; messages?: TicketMessage[];
}
export interface TicketMessage { id: number; sender_role: string; message: string; created_at: string; }
export interface GymUpdatePayload {
  description?: string; phone?: string; whatsapp?: string; telegram?: string;
  instagram?: string; website?: string; rules?: string; working_hours?: string;
}

export function hasPermission(role: string | undefined, explicit: string[] | undefined, code: PermissionCode): boolean {
  if (!role) return false;
  if (role === 'owner') return true;
  if (explicit && explicit.length > 0) return explicit.includes(code);
  const d = ROLE_DEFAULTS[role as StaffRole];
  return d ? d.includes(code) : false;
}
