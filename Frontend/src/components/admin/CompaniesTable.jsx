import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Edit2, ShieldCheck, ShieldAlert, Building2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const statusConfig = {
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  banned: { label: "Banned", className: "bg-gray-900 text-white" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const TrustBar = ({ score }) => {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${score >= 60 ? "text-green-600" : "text-red-500"}`}>{score ?? 0}</span>
    </div>
  );
};

const CompaniesTable = () => {
  const { companies, searchCompanyByText } = useSelector((store) => store.company);
  const [filterCompany, setFilterCompany] = useState(companies);
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = companies?.filter((c) =>
      !searchCompanyByText || c?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase())
    );
    setFilterCompany(filtered);
  }, [companies, searchCompanyByText]);

  if (!filterCompany?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Building2 className="w-10 h-10 opacity-20 mb-3" />
        <p className="font-medium text-gray-500 dark:text-gray-400">No companies found</p>
        <p className="text-sm mt-1">Register your first company to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Company</TableHead>
          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Website</TableHead>
          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Trust Score</TableHead>
          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
          <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Registered</TableHead>
          <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterCompany.map((company) => {
          const status = statusConfig[company.verificationStatus] || statusConfig.pending;
          return (
            <TableRow key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={company.logo} className="object-contain" />
                    <AvatarFallback className="bg-[#6A38C2]/10 text-[#6A38C2] font-bold rounded-xl">
                      {company.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{company.name}</span>
                      {company.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                    <span className="text-xs text-gray-400">{company.location || "No location"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#6A38C2] hover:underline truncate max-w-[140px] block">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : <span className="text-xs text-gray-400">—</span>}
              </TableCell>
              <TableCell><TrustBar score={company.trustScore ?? 0} /></TableCell>
              <TableCell>
                <Badge className={`text-xs font-medium ${status.className}`}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">{company.createdAt?.split("T")[0]}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/companies/${company._id}`)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CompaniesTable;
