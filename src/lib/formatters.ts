
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return "—";
    try {
        return new Date(date).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return "—";
    try {
        const d = new Date(date);
        const datePart = d.toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        });
        const timePart = d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        return `${datePart} · ${timePart}`;
    } catch {
        return "—";
    }
};

export const formatPhoneNumber = (value: string): string => {
    let formattedValue = value.replace(/\D/g, "");

    if (formattedValue.length > 0 && !formattedValue.startsWith("07")) {
        formattedValue = "07" + formattedValue.replace(/^0?7?/, "");
    }

    if (formattedValue.length > 11) {
        formattedValue = formattedValue.slice(0, 11);
    }

    return formattedValue;
};
