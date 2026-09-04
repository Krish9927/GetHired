import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Edit2, Trash2, ShieldCheck, Building2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { setCompanies } from "@/redux/companySlice";

const statusConfig = {
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  banned: { label: "Banned", className: "bg-gray-900 text-white" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const CompaniesTable = () => {
  const { companies, searchCompanyByText } = useSelector((store) => store.company);
  const [filterCompany, setFilterCompany] = useState(companies);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const filtered = companies?.filter((c) =>
      !searchCompanyByText || c?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase())
    );
    setFilterCompany(filtered);
  }, [companies, searchCompanyByText]);

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${COMPANY_API_END_POINT}/delete/${confirmDeleteId}`, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setCompanies(companies.filter((c) => c._id !== confirmDeleteId)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete company");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const confirmingCompany = companies.find((c) => c._id === confirmDeleteId);

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
    <>
      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Delete Company</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 dark:text-white">{confirmingCompany?.name}</strong>?
              All jobs and applications linked to this company will remain but the company record will be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Company</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Website</TableHead>
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
                <TableCell>
                  <Badge className={`text-xs font-medium ${status.className}`}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{company.createdAt?.split("T")[0]}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/companies/${company._id}`)}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeleteId(company._id)}
                      className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default CompaniesTable;
