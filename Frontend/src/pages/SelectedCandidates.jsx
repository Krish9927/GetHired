import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import CandidateCard from '../components/CandidateCard';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Building2 } from 'lucide-react';

const SelectedCandidates = () => {
  // Hook to fetch all companies of the recruiter into the Redux store
  useGetAllCompanies();

  const { companies } = useSelector((store) => store.company);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set the default selected company once companies are loaded
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0]._id);
    }
  }, [companies, selectedCompanyId]);

  // Fetch candidates whenever selectedCompanyId changes
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedCompanyId) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${COMPANY_API_END_POINT}/${selectedCompanyId}/selected-candidates`,
          { withCredentials: true }
        );
        if (res.data.success) {
          setCandidates(res.data.candidates || []);
        }
      } catch (err) {
        console.error('Failed to fetch selected candidates', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedCompanyId]);

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (c) => c.name.toLowerCase() === value
    );
    if (selectedCompany) {
      setSelectedCompanyId(selectedCompany._id);
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Page header */}
        <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Selected Candidates</h1>
                <p className="text-purple-200 text-sm">Candidates hired through our platform</p>
              </div>
            </div>

            {/* Company Selector dropdown */}
            {companies && companies.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">Select Company:</span>
                <Select
                  onValueChange={selectChangeHandler}
                  defaultValue={companies[0]?.name?.toLowerCase()}
                >
                  <SelectTrigger className="w-[200px] bg-white text-gray-900 border-none">
                    <SelectValue placeholder="Choose a Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((company) => (
                        <SelectItem key={company._id} value={company?.name?.toLowerCase()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A38C2]" />
            </div>
          ) : !selectedCompanyId ? (
            <div className="text-center text-gray-500 py-10">
              <p className="text-lg font-medium">Please register or select a company first.</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No candidates have been accepted/hired for this company yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((app) => (
                <CandidateCard
                  key={app._id}
                  candidate={app.applicant}
                  jobTitle={app.job?.title || 'Job Title'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SelectedCandidates;
