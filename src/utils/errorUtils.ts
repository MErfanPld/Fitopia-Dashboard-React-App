export function parseApiErrorMessage(err: any, fallbackMessage: string = 'خطایی در اجرای عملیات رخ داد.'): string {
  if (!err) return fallbackMessage;

  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string') return data;
    if (data.detail && typeof data.detail === 'string') return data.detail;
    if (data.message && typeof data.message === 'string') return data.message;
    if (typeof data === 'object') {
      const messages = Object.entries(data)
        .map(([key, val]) => {
          const valStr = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `${key}: ${valStr}`;
        })
        .join(' | ');
      if (messages) return messages;
    }
  }

  if (err.message === 'Network Error' || !err.response) {
    return 'امکان ارتباط با سرور برای ذخیره تغییرات وجود ندارد (مشکل CORS احتمالی)، لطفاً بعداً تلاش کنید یا با پشتیبانی فنی تماس بگیرید';
  }

  return err.message || fallbackMessage;
}
