import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { FormField } from '../../components/common/FormField';
import { NoGymSelected } from '../../components/common/EmptyState';
import { useGymScoped } from '../../hooks/useGymScoped';
import { useUI } from '../../context/UIContext';
import gymService from '../../services/gyms/gymService';

export const SettingsPage: React.FC = () => {
  const { gymId, hasGym, currentGym } = useGymScoped();
  const { showToast } = useUI();
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);

  if (!hasGym) return <div className="space-y-6"><Header title="\u062a\u0646\u0638\u06cc\u0645\u0627\u062a" /><NoGymSelected /></div>;

  return (
    <div className="space-y-6">
      <Header title="\u062a\u0646\u0638\u06cc\u0645\u0627\u062a \u0628\u0627\u0634\u06af\u0627\u0647" subtitle={currentGym?.gym_name || ''} />
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 space-y-4 max-w-2xl">
        <p className="text-xs text-slate-500">\u0641\u0642\u0637 \u0641\u06cc\u0644\u062f\u0647\u0627\u06cc \u067e\u0634\u062a\u06cc\u0628\u0627\u0646\u06cc\u200c\u0634\u062f\u0647 \u062a\u0648\u0633\u0637 API \u0627\u0631\u0633\u0627\u0644 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f. \u0646\u0627\u0645 \u0648 \u0622\u062f\u0631\u0633 \u0646\u06cc\u0627\u0632 \u0628\u0647 \u062a\u06cc\u06a9\u062a \u062f\u0627\u0631\u0646\u062f.</p>
        <FormField label="\u062a\u0648\u0636\u06cc\u062d\u0627\u062a" isTextArea value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormField label="\u062a\u0644\u0641\u0646" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <FormField label="\u0648\u0627\u062a\u0633\u0627\u067e" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <FormField label="\u0627\u06cc\u0646\u0633\u062a\u0627\u06af\u0631\u0627\u0645" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <FormField label="\u0633\u0627\u0639\u0627\u062a \u06a9\u0627\u0631\u06cc" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
        <FormField label="\u0642\u0648\u0627\u0646\u06cc\u0646" isTextArea value={rules} onChange={(e) => setRules(e.target.value)} />
        <button type="button" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] text-white text-sm font-semibold disabled:opacity-50" onClick={async () => {
          if (!gymId) return;
          setSaving(true);
          try {
            await gymService.update(gymId, {
              description: description || undefined,
              phone: phone || undefined,
              whatsapp: whatsapp || undefined,
              instagram: instagram || undefined,
              working_hours: workingHours || undefined,
              rules: rules || undefined,
            });
            showToast('\u062a\u0646\u0638\u06cc\u0645\u0627\u062a \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f', 'success');
          } catch (e: unknown) { showToast(e instanceof Error ? e.message : '\u062e\u0637\u0627', 'danger'); }
          finally { setSaving(false); }
        }}>\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a</button>
      </div>
    </div>
  );
};
