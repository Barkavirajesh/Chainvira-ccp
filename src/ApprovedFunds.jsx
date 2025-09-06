// src/pages/ApprovedFunds.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const ApprovedFunds = () => {
  const [funds, setFunds] = useState([]);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/funds");

        // Some APIs return { funds: [...] }, others return [...]
        const data = Array.isArray(res.data) ? res.data : res.data.funds || [];
        setFunds(data);
      } catch (error) {
        console.error("❌ Error fetching approved funds:", error);
      }
    };
    fetchFunds();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        ✅ Approved Funds
      </h2>

      {funds.length === 0 ? (
        <p>No funds allocated yet.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">
                Community Center
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Wallet Address
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Total Allocated
              </th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund, index) => (
              <tr key={fund._id || index}>
                <td className="border border-gray-300 px-4 py-2">
                  {fund.centerName}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {fund.walletAddress || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  ₹{fund.amount ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApprovedFunds;
