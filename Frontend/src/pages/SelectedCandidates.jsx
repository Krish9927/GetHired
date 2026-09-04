import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Building2, Users, Briefcase, Mail, Phone, CheckCheck } from 'lucide-react';

const SelectedCandidates = () => {
  useGetAllCompanies();
  const { companies } = useSelector((store) => store.company);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companies?.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0]._id);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${COMPANY_API_END_POINT}/${selectedCompanyId}/selected-candidates`,
          { withCredentials: true }
        );
        if (res.data.success) setCandidates(res.data.candidates || []);
      } catch (err) {
        console.error('Failed to fetch selected candidates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [selectedCompanyId]);

  const selectChangeHandler = (value) => {
    const company = companies.find((c) => c.name.toLowerCase() === value);
    if (company) setSelectedCompanyId(company._id);
  };

  // Group candidates by job title
  const grouped = candidates.reduce((acc, app) => {
    const title = app.job?.title || 'Unknown Role';
    if (!acc[title]) acc[title] = [];
    acc[title].push(app);
    return acc;
  }, {});

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Selected Candidates</h1>
                <p className="text-purple-200 text-sm">
                  {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} hired · {Object.keys(grouped).length} role{Object.keys(grouped).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {companies?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">Company:</span>
                <Select onValueChange={selectChangeHandler} defaultValue={companies[0]?.name?.toLowerCase()}>
                  <SelectTrigger className="w-[200px] bg-white text-gray-900 border-none">
                    <SelectValue placeholder="Choose a Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((c) => (
                        <SelectItem key={c._id} value={c.name.toLowerCase()}>{c.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A38C2]" />
            </div>
          ) : !selectedCompanyId ? (
            <p className="text-center text-gray-500 py-10 text-lg">Please select a company first.</p>
          ) : candidates.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No candidates selected yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Accept applicants from the Applicants page, then close the selection to see them here.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([jobTitle, apps]) => (
              <div key={jobTitle}>
                {/* Job title section header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#6A38C2]/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#6A38C2]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{jobTitle}</h2>
                  <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {apps.length} selected
                  </span>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => (
                    <div
                      key={app._id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex items-start gap-4"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[#6A38C2]/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {app.applicant?.profile?.profilePhoto ? (
                          <img
                            src={app.applicant.profile.profilePhoto}
                            alt={app.applicant.fullname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[#6A38C2] font-bold text-lg">
                            {app.applicant?.fullname?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {app.applicant?.fullname}
                        </p>
                        {app.applicant?.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{app.applicant.email}</span>
                          </div>
                        )}
                        {app.applicant?.phoneNumber && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{app.applicant.phoneNumber}</span>
                          </div>
                        )}
                        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✓ Selected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SelectedCandidates;
