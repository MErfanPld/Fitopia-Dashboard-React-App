import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { FormField } from '../components/common/FormField';
import { GymStaffAccess } from '../types';
import gymService, { Sport } from '../services/gymService';
import coachService, { GymCoach } from '../services/coachService';
import { parseApiErrorMessage } from '../utils/errorUtils';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Users,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Instagram,
  Send,
  User,
  Award,
  Check,
} from 'lucide-react';

export const GymsPage: React.FC = () => {
  const { currentGym, gymAccessList, setCurrentGym } = useAuth();

  const [activePageTab, setActivePageTab] = useState<'gyms' | 'coaches'>('gyms');

  // Gyms state
  const [gyms, setGyms] = useState<GymStaffAccess[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [gymError, setGymError] = useState<string | null>(null);

  // Edit Gym state
  const [editingGym, setEditingGym] = useState<GymStaffAccess | null>(null);
  const [editingGymData, setEditingGymData] = useState<{
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    description: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
    website: string;
    rules: string;
    working_hours: string;
    cover_image_url: string;
    cover_image_file: File | null;
  }>({
    // Restricted fields
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    // Free-edit fields
    description: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    instagram: '',
    website: '',
    rules: '',
    working_hours: '',
    cover_image_url: '',
    cover_image_file: null,
  });
  const [isUpdatingGym, setIsUpdatingGym] = useState(false);
  const [loadingGymDetail, setLoadingGymDetail] = useState(false);
  const [gymSuccessMessage, setGymSuccessMessage] = useState<string | null>(null);
  const [gymModalError, setGymModalError] = useState<string | null>(null);

  // Coaches state
  const [coaches, setCoaches] = useState<GymCoach[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Sports state
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(false);

  // Coach modal state
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<GymCoach | null>(null);
  const [loadingCoachDetail, setLoadingCoachDetail] = useState(false);
  const [coachFormData, setCoachFormData] = useState<{
    full_name: string;
    specialty: string;
    image: string;
    image_file: File | null;
    sports: number[];
  }>({
    full_name: '',
    specialty: '',
    image: '',
    image_file: null,
    sports: [],
  });
  const [coachModalError, setCoachModalError] = useState<string | null>(null);
  const [isSavingCoach, setIsSavingCoach] = useState(false);
  const [deletingCoach, setDeletingCoach] = useState<GymCoach | null>(null);
  const [isDeletingCoach, setIsDeletingCoach] = useState(false);

  const selectedGymId = currentGym?.gym || currentGym?.id || gymAccessList[0]?.gym || gymAccessList[0]?.id;

  // 1. Fetch Gyms list
  const fetchGyms = async () => {
    setLoadingGyms(true);
    setGymError(null);
    try {
      const data = await gymService.getGyms();
      setGyms(data || []);
      if (data && data.length > 0 && !currentGym) {
        setCurrentGym(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch gyms:', err);
      // Fallback to gymAccessList from auth context if available
      if (gymAccessList && gymAccessList.length > 0) {
        setGyms(gymAccessList);
      } else {
        setGymError('خطا در دریافت لیست باشگاه‌ها.');
      }
    } finally {
      setLoadingGyms(false);
    }
  };

  // 2. Fetch Coaches for current selected gym
  const fetchCoaches = async () => {
    if (!selectedGymId) return;
    setLoadingCoaches(true);
    setCoachError(null);
    try {
      const data = await coachService.getCoaches(selectedGymId);
      setCoaches(data || []);
    } catch (err: any) {
      console.error('Failed to fetch coaches:', err);
      setCoachError('خطا در دریافت لیست مربیان.');
    } finally {
      setLoadingCoaches(false);
    }
  };

  // Fetch sports list
  const fetchSports = async () => {
    setLoadingSports(true);
    try {
      const sportsData = await gymService.getSports();
      setAllSports(sportsData || []);
    } catch (err) {
      console.warn('Could not fetch sports list:', err);
    } finally {
      setLoadingSports(false);
    }
  };

  useEffect(() => {
    fetchGyms();
    fetchSports();
  }, []);

  useEffect(() => {
    if (selectedGymId && activePageTab === 'coaches') {
      fetchCoaches();
    }
  }, [selectedGymId, activePageTab]);

  // Unified helper to refetch list and active gym details from backend
  const refetchGymData = async () => {
    await fetchGyms();
    if (selectedGymId) {
      try {
        const freshDetail = await gymService.getGymDetail(selectedGymId);
        if (freshDetail && currentGym) {
          setCurrentGym({
            ...currentGym,
            gym_name: freshDetail.name || freshDetail.gym_name || currentGym.gym_name,
            gym_address: freshDetail.address || freshDetail.gym_address || currentGym.gym_address,
          });
        }
      } catch (e) {
        // ignore fallback
      }
    }
  };

  // Open Edit Gym Modal and fetch full details directly from backend GET API
  const openEditGymModal = async (gym: GymStaffAccess) => {
    setEditingGym(gym);
    setLoadingGymDetail(true);
    setGymSuccessMessage(null);
    setGymModalError(null);

    const gymId = gym.gym ?? (gym as any).gym_id ?? gym.id;

    const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}')[gymId] || {};

    // Populate initial fallback form data
    const initialName = gym.gym_name || (gym as any).name || localOverrides.name || localOverrides.gym_name || '';
    const initialAddress = gym.gym_address || (gym as any).address || localOverrides.address || localOverrides.gym_address || '';

    setEditingGymData({
      name: initialName,
      address: initialAddress,
      latitude: (gym as any).latitude != null ? String((gym as any).latitude) : (localOverrides.latitude ? String(localOverrides.latitude) : ''),
      longitude: (gym as any).longitude != null ? String((gym as any).longitude) : (localOverrides.longitude ? String(localOverrides.longitude) : ''),
      description: (gym as any).description || localOverrides.description || '',
      phone: (gym as any).phone || localOverrides.phone || '',
      whatsapp: (gym as any).whatsapp || localOverrides.whatsapp || '',
      telegram: (gym as any).telegram || localOverrides.telegram || '',
      instagram: (gym as any).instagram || localOverrides.instagram || '',
      website: (gym as any).website || localOverrides.website || '',
      rules: (gym as any).rules || localOverrides.rules || '',
      working_hours: (gym as any).working_hours || localOverrides.working_hours || '',
      cover_image_url: (gym as any).cover_image || (gym as any).cover_image_url || localOverrides.cover_image || localOverrides.cover_image_url || '',
      cover_image_file: null,
    });

    try {
      // 1. Fetch fresh list of gyms from GET /gym-panel/gyms/ to ensure latest confirmed data
      const freshGyms = await gymService.getGyms();
      setGyms(freshGyms);
      const freshGym = freshGyms.find((g) => (g.gym ?? (g as any).gym_id ?? g.id) === gymId) || gym;

      const freshName = freshGym.gym_name || (freshGym as any).name || initialName;
      const freshAddress = freshGym.gym_address || (freshGym as any).address || initialAddress;
      const freshLat = (freshGym as any).latitude != null ? String((freshGym as any).latitude) : ((freshGym as any).location?.latitude != null ? String((freshGym as any).location.latitude) : '');
      const freshLng = (freshGym as any).longitude != null ? String((freshGym as any).longitude) : ((freshGym as any).location?.longitude != null ? String((freshGym as any).location.longitude) : '');

      setEditingGymData({
        name: freshName,
        address: freshAddress,
        latitude: freshLat,
        longitude: freshLng,
        description: (freshGym as any).description ?? '',
        phone: (freshGym as any).phone ?? '',
        whatsapp: (freshGym as any).whatsapp ?? '',
        telegram: (freshGym as any).telegram ?? '',
        instagram: (freshGym as any).instagram ?? '',
        website: (freshGym as any).website ?? '',
        rules: (freshGym as any).rules ?? '',
        working_hours: (freshGym as any).working_hours ?? '',
        cover_image_url: (freshGym as any).cover_image ?? (freshGym as any).cover_image_url ?? '',
        cover_image_file: null,
      });

      // Sync editingGym header label with fresh server data
      setEditingGym({
        ...freshGym,
        gym_name: freshName,
        gym_address: freshAddress,
      });
    } catch (err) {
      console.warn('Could not fetch fresh gym detail from API:', err);
    } finally {
      setLoadingGymDetail(false);
    }
  };

  // Handle Gym Edit Form Submit
  const handleGymEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym || isUpdatingGym) return;

    const gymId = editingGym.gym ?? (editingGym as any).gym_id ?? editingGym.id;
    setIsUpdatingGym(true);
    setGymSuccessMessage(null);
    setGymModalError(null);

    try {
      // 1. Allowed free-editable schema fields payload (only send non-empty/modified values)
      const updatePayload: Record<string, any> = {};
      if (editingGymData.description?.trim()) updatePayload.description = editingGymData.description.trim();
      if (editingGymData.phone?.trim()) updatePayload.phone = editingGymData.phone.trim();
      if (editingGymData.whatsapp?.trim()) updatePayload.whatsapp = editingGymData.whatsapp.trim();
      if (editingGymData.telegram?.trim()) updatePayload.telegram = editingGymData.telegram.trim();
      if (editingGymData.instagram?.trim()) updatePayload.instagram = editingGymData.instagram.trim();
      if (editingGymData.website?.trim()) updatePayload.website = editingGymData.website.trim();
      if (editingGymData.rules?.trim()) updatePayload.rules = editingGymData.rules.trim();
      if (editingGymData.working_hours?.trim()) updatePayload.working_hours = editingGymData.working_hours.trim();
      if (editingGymData.cover_image_file) updatePayload.cover_image = editingGymData.cover_image_file;

      // Call PATCH update gym
      const serverResponse = await gymService.updateGym(gymId, updatePayload);

      // 2. Submit change request for restricted fields if modified
      const restrictedPayload: Record<string, any> = {};
      if (editingGymData.name?.trim() && editingGymData.name.trim() !== editingGym.gym_name) {
        restrictedPayload.name = editingGymData.name.trim();
      }
      if (editingGymData.address?.trim() && editingGymData.address.trim() !== editingGym.gym_address) {
        restrictedPayload.address = editingGymData.address.trim();
      }
      if (editingGymData.latitude && editingGymData.longitude) {
        restrictedPayload.latitude = parseFloat(editingGymData.latitude);
        restrictedPayload.longitude = parseFloat(editingGymData.longitude);
      }

      if (Object.keys(restrictedPayload).length > 0) {
        try {
          await gymService.requestChange(gymId, restrictedPayload);
        } catch (reqErr) {
          console.warn('Change request for restricted fields notice:', reqErr);
        }
      }

      // Update current active gym in AuthContext with server data / local modifications
      if (currentGym && (currentGym.gym === gymId || currentGym.id === gymId)) {
        setCurrentGym({
          ...currentGym,
          ...(typeof serverResponse === 'object' ? serverResponse : {}),
          gym_name: editingGymData.name?.trim() || currentGym.gym_name,
          gym_address: editingGymData.address?.trim() || currentGym.gym_address,
        });
      }

      setGymSuccessMessage('اطلاعات باشگاه با موفقیت در دیتابیس به‌روزرسانی شد.');

      // Refresh list & active gym details immediately to show updated details
      await refetchGymData();

      setTimeout(() => {
        setEditingGym(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update gym:', err);
      const errMsg = parseApiErrorMessage(err, 'خطا در بروزرسانی مشخصات باشگاه.');
      setGymModalError(errMsg);
    } finally {
      setIsUpdatingGym(false);
    }
  };

  // Coach Handlers
  const openAddCoachModal = () => {
    setEditingCoach(null);
    setCoachFormData({
      full_name: '',
      specialty: '',
      image: '',
      image_file: null,
      sports: [],
    });
    setCoachModalError(null);
    if (allSports.length === 0) {
      fetchSports();
    }
    setIsCoachModalOpen(true);
  };

  const openEditCoachModal = async (coach: GymCoach) => {
    setEditingCoach(coach);
    setCoachFormData({
      full_name: coach.full_name || '',
      specialty: coach.specialty || '',
      image: coach.image || '',
      image_file: null,
      sports: Array.isArray(coach.sports) ? [...coach.sports] : [],
    });
    setCoachModalError(null);
    if (allSports.length === 0) {
      fetchSports();
    }
    setIsCoachModalOpen(true);

    if (selectedGymId && coach.id) {
      setLoadingCoachDetail(true);
      try {
        const freshCoach = await coachService.getCoach(selectedGymId, coach.id);
        if (freshCoach) {
          setEditingCoach(freshCoach);
          setCoachFormData({
            full_name: freshCoach.full_name || '',
            specialty: freshCoach.specialty || '',
            image: freshCoach.image || '',
            image_file: null,
            sports: Array.isArray(freshCoach.sports) ? [...freshCoach.sports] : [],
          });
        }
      } catch (err: any) {
        console.warn('Could not fetch fresh coach details from server:', err);
      } finally {
        setLoadingCoachDetail(false);
      }
    }
  };

  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGymId) return;

    if (!coachFormData.full_name.trim()) {
      setCoachModalError('لطفاً نام و نام خانوادگی مربی را وارد کنید.');
      return;
    }

    setIsSavingCoach(true);
    setCoachModalError(null);

    const sportsArray = coachFormData.sports;

    try {
      let savedCoach: GymCoach;
      if (editingCoach) {
        const patchData: any = {};
        if (coachFormData.full_name.trim()) {
          patchData.full_name = coachFormData.full_name.trim();
        }
        if (coachFormData.specialty.trim() !== (editingCoach.specialty || '')) {
          patchData.specialty = coachFormData.specialty.trim();
        }
        if (coachFormData.image_file) {
          patchData.image_file = coachFormData.image_file;
        } else if (coachFormData.image.trim() !== (editingCoach.image || '')) {
          patchData.image = coachFormData.image.trim();
        }
        patchData.sports = sportsArray;

        savedCoach = await coachService.patchCoach(selectedGymId, editingCoach.id, patchData);
        setCoaches((prev) => prev.map((c) => (c.id === savedCoach.id ? savedCoach : c)));
      } else {
        const createData = {
          full_name: coachFormData.full_name.trim(),
          specialty: coachFormData.specialty.trim(),
          image: coachFormData.image.trim() || undefined,
          image_file: coachFormData.image_file,
          sports: sportsArray,
        };
        savedCoach = await coachService.createCoach(selectedGymId, createData);
        setCoaches((prev) => [savedCoach, ...prev]);
      }

      setIsCoachModalOpen(false);
      fetchCoaches();
    } catch (err: any) {
      console.error('Failed to save coach:', err);
      const errMsg = parseApiErrorMessage(err, 'خطا در ثبت اطلاعات مربی.');
      setCoachModalError(errMsg);
    } finally {
      setIsSavingCoach(false);
    }
  };

  const handleConfirmDeleteCoach = async () => {
    if (!deletingCoach || !selectedGymId) return;
    setIsDeletingCoach(true);
    try {
      await coachService.deleteCoach(selectedGymId, deletingCoach.id);
      setCoaches((prev) => prev.filter((c) => c.id !== deletingCoach.id));
      setDeletingCoach(null);
      fetchCoaches();
    } catch (err: any) {
      console.error('Failed to delete coach:', err);
      alert(parseApiErrorMessage(err, 'خطا در حذف مربی.'));
    } finally {
      setIsDeletingCoach(false);
    }
  };

  // Gyms Table Columns
  const gymColumns: Column<GymStaffAccess>[] = [
    {
      key: 'gym_name',
      header: 'نام باشگاه / مجموعه',
      sortable: true,
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#FF7A1A] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-white block text-sm">{g.gym_name}</span>
            <span className="text-[11px] text-slate-400 font-mono">شناسه باشگاه: #{g.gym}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'سطح دسترسی / نقش',
      sortable: true,
      render: (g) => {
        const roleLabel = g.role === 'owner' ? 'مالک مجموعه' : 'پرسنل / مربی';
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
            {roleLabel}
          </span>
        );
      },
    },
    {
      key: 'id',
      header: 'شناسه دسترسی',
      sortable: true,
      render: (g) => <span className="font-mono text-slate-400 text-xs">#{g.id}</span>,
    },
  ];

  // Coaches Table Columns
  const coachColumns: Column<GymCoach>[] = [
    {
      key: 'full_name',
      header: 'نام و نام خانوادگی مربی',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] overflow-hidden flex items-center justify-center text-[#FF7A1A] shrink-0">
            {c.image ? (
              <img src={c.image} alt={c.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="font-bold text-white block text-sm">{c.full_name}</span>
            <span className="text-[11px] text-slate-400 font-mono">کد مربی: #{c.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'specialty',
      header: 'تخصص و مدرک',
      sortable: true,
      render: (c) => (
        <span className="text-slate-300 text-xs font-semibold flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-[#FF7A1A]" />
          {c.specialty || 'ثبت نشده'}
        </span>
      ),
    },
    {
      key: 'sports',
      header: 'رشته‌های ورزشی',
      sortable: false,
      render: (c) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {c.sports && c.sports.length > 0 ? (
            c.sports.map((sportId) => {
              const found = allSports.find((s) => s.id === sportId);
              const name = found ? found.name : `کد ${sportId}`;
              return (
                <span
                  key={sportId}
                  className="px-2.5 py-0.5 bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20 rounded-lg text-xs font-bold"
                >
                  {name}
                </span>
              );
            })
          ) : (
            <span className="text-slate-500 text-[11px]">بدون رشته</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Header
        title="مدیریت باشگاه‌ها و مربیان"
        subtitle="ویرایش مشخصات مجموعه ورزشی و مدیریت لیست مربیان رسمی"
        quickActionLabel={activePageTab === 'coaches' ? 'افزودن مربی جدید' : undefined}
        onQuickAction={activePageTab === 'coaches' ? openAddCoachModal : undefined}
      />

      {/* Main Page Tabs */}
      <div className="flex items-center gap-3 border-b border-[#262626] pb-3">
        <button
          onClick={() => setActivePageTab('gyms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activePageTab === 'gyms'
              ? 'bg-[#FF7A1A] text-slate-950 shadow-lg shadow-[#FF7A1A]/20'
              : 'bg-[#181818] text-slate-300 hover:bg-[#242424]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>لیست باشگاه‌های من ({gyms.length})</span>
        </button>

        <button
          onClick={() => setActivePageTab('coaches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activePageTab === 'coaches'
              ? 'bg-[#FF7A1A] text-slate-950 shadow-lg shadow-[#FF7A1A]/20'
              : 'bg-[#181818] text-slate-300 hover:bg-[#242424]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>مدیریت مربیان باشگاه</span>
        </button>
      </div>

      {/* TAB 1: GYMS LIST */}
      {activePageTab === 'gyms' && (
        <div className="space-y-4">
          {loadingGyms ? (
            <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-[#FF7A1A] animate-spin" />
              <span className="text-xs">در حال دریافت اطلاعات باشگاه‌ها...</span>
            </div>
          ) : gymError ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center justify-between">
              <span>{gymError}</span>
              <button
                onClick={fetchGyms}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold"
              >
                تلاش مجدد
              </button>
            </div>
          ) : (
            <DataTable
              columns={gymColumns}
              data={gyms}
              searchPlaceholder="جستجوی نام باشگاه..."
              searchKeys={['gym_name']}
              actions={(gym) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentGym(gym);
                      openEditGymModal(gym);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#FF7A1A] hover:text-slate-950 text-slate-200 text-xs font-bold transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>ویرایش اطلاعات</span>
                  </button>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* TAB 2: COACHES CRUD */}
      {activePageTab === 'coaches' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#141414] border border-[#262626] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-500">باشگاه فعال:</span>
              <span className="font-black text-white">{currentGym?.gym_name || 'انتخاب نشده'}</span>
            </div>
            <button
              onClick={openAddCoachModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-[#FF7A1A]/20"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مربی جدید</span>
            </button>
          </div>

          {loadingCoaches ? (
            <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-[#FF7A1A] animate-spin" />
              <span className="text-xs">در حال دریافت لیست مربیان...</span>
            </div>
          ) : coachError ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center justify-between">
              <span>{coachError}</span>
              <button
                onClick={fetchCoaches}
                className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg font-bold"
              >
                تلاش مجدد
              </button>
            </div>
          ) : coaches.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-[#141414] border border-[#262626] rounded-2xl space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">هنوز مربی‌ای ثبت نشده است</p>
              <p className="text-xs text-slate-500">
                برای افزودن اولین مربی به این باشگاه، از دکمه «افزودن مربی جدید» استفاده کنید.
              </p>
            </div>
          ) : (
            <DataTable
              columns={coachColumns}
              data={coaches}
              searchPlaceholder="جستجوی نام یا تخصص مربی..."
              searchKeys={['full_name', 'specialty']}
              actions={(coach) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditCoachModal(coach)}
                    className="p-1.5 text-slate-400 hover:text-[#FF7A1A] hover:bg-[#FF7A1A]/10 rounded-lg transition-colors"
                    title="ویرایش مربی"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingCoach(coach)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="حذف مربی"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* EDIT GYM MODAL */}
      {editingGym && (
        <Modal
          isOpen={!!editingGym}
          onClose={() => setEditingGym(null)}
          title={`ویرایش مشخصات باشگاه ${editingGym.gym_name}`}
          maxWidth="xl"
        >
          <form onSubmit={handleGymEditSubmit} className="space-y-4">
            {loadingGymDetail && (
              <div className="p-2.5 bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 rounded-xl text-xs text-[#FF7A1A] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>در حال دریافت و بروزرسانی آخرین اطلاعات از سرور...</span>
              </div>
            )}

            {gymSuccessMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
                {gymSuccessMessage}
              </div>
            )}

              {gymModalError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400">
                  {gymModalError}
                </div>
              )}

            {/* Free-editable fields section */}
            <div className="space-y-3 p-3.5 bg-[#121212] border border-[#242424] rounded-2xl">
              <span className="text-xs font-bold text-[#FF7A1A] block">مشخصات قابل ویرایش مستقیم</span>

              {/* Cover Image Upload & Preview */}
              <div className="space-y-2 p-3 bg-[#181818] rounded-xl border border-[#282828]">
                <label className="text-xs font-bold text-slate-300 block">تصویر کاور باشگاه</label>
                {(editingGymData.cover_image_file || editingGymData.cover_image_url) && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#333] bg-[#111]">
                    <img
                      src={
                        editingGymData.cover_image_file
                          ? URL.createObjectURL(editingGymData.cover_image_file)
                          : editingGymData.cover_image_url
                      }
                      alt="پیش‌نمایش کاور"
                      className="w-full h-full object-cover"
                    />
                    {editingGymData.cover_image_file && (
                      <span className="absolute top-2 right-2 px-2.5 py-1 bg-[#FF7A1A] text-slate-950 font-black text-[10px] rounded-md shadow-md">
                        تصویر جدید انتخاب شده
                      </span>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditingGymData({ ...editingGymData, cover_image_file: file });
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:ml-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FF7A1A]/10 file:text-[#FF7A1A] hover:file:bg-[#FF7A1A]/20 cursor-pointer"
                />
              </div>

              <FormField
                label="توضیحات و بیوگرافی باشگاه"
                isTextArea
                rows={2}
                placeholder="توضیحات معرفی باشگاه..."
                value={editingGymData.description}
                onChange={(e) => setEditingGymData({ ...editingGymData, description: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="شماره تماس"
                  placeholder="02188888888"
                  value={editingGymData.phone}
                  onChange={(e) => setEditingGymData({ ...editingGymData, phone: e.target.value })}
                />
                <FormField
                  label="شماره واتس‌اپ"
                  placeholder="09123456789"
                  value={editingGymData.whatsapp}
                  onChange={(e) => setEditingGymData({ ...editingGymData, whatsapp: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="آیدی تلگرام"
                  placeholder="@gym_id"
                  value={editingGymData.telegram}
                  onChange={(e) => setEditingGymData({ ...editingGymData, telegram: e.target.value })}
                />
                <FormField
                  label="پیج اینستاگرام"
                  placeholder="gym_official"
                  value={editingGymData.instagram}
                  onChange={(e) => setEditingGymData({ ...editingGymData, instagram: e.target.value })}
                />
              </div>

              <FormField
                label="آدرس وب‌سایت باشگاه"
                type="url"
                placeholder="https://oxygengym.ir"
                value={editingGymData.website}
                onChange={(e) => setEditingGymData({ ...editingGymData, website: e.target.value })}
              />

              <FormField
                label="ساعات کاری باشگاه"
                isTextArea
                rows={2}
                placeholder="شنبه تا پنجشنبه ۰۶:۰۰ الی ۲۳:۰۰&#10;جمعه ۰۸:۰۰ الی ۲۰:۰۰"
                value={editingGymData.working_hours}
                onChange={(e) => setEditingGymData({ ...editingGymData, working_hours: e.target.value })}
              />

              <FormField
                label="قوانین و مقررات باشگاه"
                isTextArea
                rows={3}
                placeholder="ورود با کفش ورزشی الزامی است.&#10;رعایت بهداشت فردی الزامی است."
                value={editingGymData.rules}
                onChange={(e) => setEditingGymData({ ...editingGymData, rules: e.target.value })}
              />
            </div>

            {/* Restricted fields section */}
            <div className="space-y-3 p-3.5 bg-[#121212] border border-[#242424] rounded-2xl">
              <span className="text-xs font-bold text-amber-400 block">
                تغییر اطلاعات اصلی (نیازمند بررسی و تایید فیتوپیا)
              </span>

              <FormField
                label="نام مجموعه ورزشی"
                value={editingGymData.name}
                onChange={(e) => setEditingGymData({ ...editingGymData, name: e.target.value })}
              />

              <FormField
                label="آدرس دقیق مجموعه"
                isTextArea
                rows={2}
                placeholder="آدرس جدید..."
                value={editingGymData.address}
                onChange={(e) => setEditingGymData({ ...editingGymData, address: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="عرض جغرافیایی (Latitude)"
                  placeholder="35.6892"
                  value={editingGymData.latitude}
                  onChange={(e) => setEditingGymData({ ...editingGymData, latitude: e.target.value })}
                />
                <FormField
                  label="طول جغرافیایی (Longitude)"
                  placeholder="51.3890"
                  value={editingGymData.longitude}
                  onChange={(e) => setEditingGymData({ ...editingGymData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setEditingGym(null)}
                className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isUpdatingGym}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50"
              >
                {isUpdatingGym ? 'در حال ثبت...' : 'ذخیره و ثبت تغییرات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* COACH ADD / EDIT MODAL */}
      {isCoachModalOpen && (
        <Modal
          isOpen={isCoachModalOpen}
          onClose={() => setIsCoachModalOpen(false)}
          title={editingCoach ? `ویرایش مربی: ${editingCoach.full_name}` : 'افزودن مربی جدید'}
        >
          <form onSubmit={handleCoachSubmit} className="space-y-4">
            {coachModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{coachModalError}</span>
              </div>
            )}

            {loadingCoachDetail && (
              <div className="p-3 bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 rounded-xl text-[#FF7A1A] text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>در حال به‌روزرسانی اطلاعات مربی از سرور...</span>
              </div>
            )}

            <FormField
              label="نام و نام خانوادگی مربی"
              required
              placeholder="مثلا: علی رضایی"
              value={coachFormData.full_name}
              onChange={(e) => setCoachFormData({ ...coachFormData, full_name: e.target.value })}
            />

            <FormField
              label="تخصص و مدرک مربیگری"
              placeholder="مثلا: مربی درجه یک بدنسازی و فیتنس"
              value={coachFormData.specialty}
              onChange={(e) => setCoachFormData({ ...coachFormData, specialty: e.target.value })}
            />

            {/* Coach Image Upload & Preview */}
            <div className="space-y-2 p-3 bg-[#181818] rounded-xl border border-[#282828]">
              <label className="text-xs font-bold text-slate-300 block">تصویر مربی</label>
              {(coachFormData.image_file || coachFormData.image) && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#333] bg-[#111] mx-auto mb-2">
                  <img
                    src={
                      coachFormData.image_file
                        ? URL.createObjectURL(coachFormData.image_file)
                        : coachFormData.image
                    }
                    alt="پیش‌نمایش تصویر مربی"
                    className="w-full h-full object-cover"
                  />
                  {coachFormData.image_file && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[#FF7A1A] text-slate-950 font-black text-[9px] rounded">
                      جدید
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoachFormData({ ...coachFormData, image_file: file });
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:ml-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FF7A1A]/10 file:text-[#FF7A1A] hover:file:bg-[#FF7A1A]/20 cursor-pointer"
                />
                <FormField
                  label="یا آدرس اینترنتی تصویر (URL)"
                  placeholder="https://..."
                  value={coachFormData.image}
                  onChange={(e) => setCoachFormData({ ...coachFormData, image: e.target.value })}
                />
              </div>
            </div>

            {/* Multi-Select Sports Field */}
            <div className="space-y-2.5 p-3.5 bg-[#181818] rounded-2xl border border-[#282828]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  رشته‌های ورزشی مربی
                </label>
                {loadingSports && (
                  <span className="text-[11px] text-[#FF7A1A] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                    <span>در حال بارگذاری...</span>
                  </span>
                )}
              </div>

              {allSports.length === 0 && !loadingSports ? (
                <div className="text-xs text-slate-500 py-2">
                  رشته ورزشی یافت نشد.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {allSports.map((sport) => {
                    const isSelected = coachFormData.sports.includes(sport.id);
                    return (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCoachFormData({
                              ...coachFormData,
                              sports: coachFormData.sports.filter((id) => id !== sport.id),
                            });
                          } else {
                            setCoachFormData({
                              ...coachFormData,
                              sports: [...coachFormData.sports, sport.id],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#FF7A1A] text-slate-950 border-[#FF7A1A] shadow-md shadow-[#FF7A1A]/20'
                            : 'bg-[#222] hover:bg-[#2a2a2a] text-slate-300 border-[#333]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{sport.name}</span>
                      </button>
                    );
                  })}

                  {/* Fallback for unlisted sport IDs */}
                  {coachFormData.sports
                    .filter((id) => !allSports.some((s) => s.id === id))
                    .map((unlistedId) => (
                      <button
                        key={`unlisted-${unlistedId}`}
                        type="button"
                        onClick={() => {
                          setCoachFormData({
                            ...coachFormData,
                            sports: coachFormData.sports.filter((id) => id !== unlistedId),
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF7A1A] text-slate-950 border border-[#FF7A1A] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>رشته #{unlistedId}</span>
                      </button>
                    ))}
                </div>
              )}

              {coachFormData.sports.length > 0 && (
                <div className="text-[11px] text-slate-400 font-semibold pt-1 flex items-center justify-between border-t border-[#252525]">
                  <span>{coachFormData.sports.length} رشته ورزشی انتخاب شده</span>
                  <button
                    type="button"
                    onClick={() => setCoachFormData({ ...coachFormData, sports: [] })}
                    className="text-red-400 hover:underline cursor-pointer font-bold"
                  >
                    حذف همه انتخاب‌ها
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setIsCoachModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#222] text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSavingCoach}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-black text-xs shadow-lg shadow-[#FF7A1A]/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingCoach && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isSavingCoach ? 'در حال ذخیره...' : editingCoach ? 'بروزرسانی مربی' : 'ثبت مربی'}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE COACH MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deletingCoach}
        onClose={() => setDeletingCoach(null)}
        onConfirm={handleConfirmDeleteCoach}
        itemName={deletingCoach?.full_name || ''}
        description="آیا از حذف این مربی از لیست مربیان رسمی باشگاه اطمینان دارید؟"
      />
    </div>
  );
};
