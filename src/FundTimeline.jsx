import React, { useEffect, useState } from "react";
import axios from "axios";

const FundTimeline = () => {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/fundTimeline");
        setTimeline(res.data);
      } catch (error) {
        console.error("❌ Error fetching fund timeline:", error);
      }
    };
    fetchTimeline();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📜 Fund Timeline</h2>

      {timeline.length === 0 ? (
        <p>No timeline events found.</p>
      ) : (
        <ul className="space-y-4">
          {timeline.map((event, idx) => (
            <li
              key={idx}
              className="border rounded-lg p-4 shadow-md bg-white"
            >
              <div className="font-semibold text-lg">{event.type}</div>
              <div>Center: {event.centerName}</div>
              <div>Amount: ₹{event.amount}</div>
              <div>Reason: {event.description}</div>
              <div>Status: {event.status}</div>
              <div className="text-sm text-gray-500">
                {new Date(event.date).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FundTimeline;
