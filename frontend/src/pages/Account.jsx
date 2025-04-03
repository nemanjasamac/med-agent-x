import { useEffect, useState } from "react";
import axios from "axios";
import AccountSettings from "../components/AccountSettings";

export default function Account() {
    const [doctor, setDoctor] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchDoctor = () => {
        axios.get('http://localhost:8000/account', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(res => setDoctor(res.data)).catch(err => console.error(err));
    };

    useEffect(() => {
        fetchDoctor();
    }, []);

    if (!doctor) return <div>Loading account...</div>;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-2">My Account</h1>
            <p><strong>Username: </strong>{doctor.username}</p>
            <p><strong>Email: </strong>{doctor.email}</p>
            <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
                Edit Account
            </button>

            {showModal && (
                <AccountSettings
                    doctor={doctor}
                    refreshDoctor={fetchDoctor}
                    close={() => setShowModal(false)}
                />
            )}
        </div>
    );
}