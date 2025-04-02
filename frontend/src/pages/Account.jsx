import {useEffect, useState} from "react";
import axios from "axios";

export default function Account(){
    const [doctor, setDoctor] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/account', {
            headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
        }).then(res => setDoctor(res.data)).catch(err => console.error(err));
    }, [])

    if (!doctor) return <div>Loading account...</div>

    return(
        <div className="p-4">
            <h1 className="text-xl font-bold mb-2">My Account</h1>
            <p><strong>Username: </strong>{doctor.username}</p>
            <p><strong>Email: </strong>{doctor.email}</p>
        </div>
    )
}