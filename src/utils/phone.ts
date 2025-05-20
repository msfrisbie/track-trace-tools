export function formatPhoneNumber(phone: string | undefined): string {
    if (!phone) {
        return "";
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
}
