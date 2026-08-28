import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2, Eye, RefreshCw, UserPlus, User } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { FormField } from '../../components/common/FormField';
import { JalaliDatePicker } from '../../components/common/JalaliDatePicker';
import { EmptyState, ErrorBlock, LoadingBlock, NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import membersService from '../../services/members/membersService';
import sportsService from '../../services/sports/sportsService';
import coachesService from '../../services/coaches/coachesService';
import type { GymMember, GymMemberInput, Sport, GymCoach } from '../../types/api';
import { formatJalaliNumeric, formatJalaliDateTime, toPersianDigits } from '../../utils/jalaliUtils';

type FitopiaFilter = 'all' | 'fitopia' | 'gym';
type SourceFilter = 'all' | 'manual' | 'token';
type StatusFilter = 'all' | 'active' | 'expired' | 'suspended' | 'inactive';

const MEMBERSHIP_STATUS_OPTIONS = [
  { value: 'active', label: 'فعال' },
  { value: 'expired', label: 'منقضی' },
  { value: 'suspended', label: 'معلق' },
  { value: 'inactive', label: 'غیرفعال' },
];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: 'session_pack', label: 'بسته جلسات' },
  { value: 'monthly', label: 'ماهانه' },
  { value: 'course', label: 'دوره' },
  { value: 'drop_in', label: 'تک‌جلسه' },
];

// Restored base - full UX update applied locally; re-push pending
export { MembersPage } from './MembersPageImpl';
export default function MembersPage() {
  return null;
}
