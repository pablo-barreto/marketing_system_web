'use client';
import { useState, useEffect } from 'react';

const FormattedDate = ({ dateString }) => {
    const [date, setDate] = useState(null);

    useEffect(() => {
        if (dateString) {
            setDate(new Date(dateString).toLocaleDateString());
        }
    }, [dateString]);

    if (!date) return <span>...</span>; // Placeholder mientras carga en el cliente
    return <span>{date}</span>;
};

export default FormattedDate;