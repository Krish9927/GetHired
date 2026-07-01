import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ArrowRight } from 'lucide-react';

/**
 * Reusable card component to display a selected candidate.
 * Shows the candidate's profile photo (or initials), name, email, and the job they were hired for.
 * Includes a "View Profile" button with a subtle hover animation.
 */
const CandidateCard = ({ candidate, jobTitle }) => {
  const initials = candidate.fullname
    ? candidate.fullname
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'C';

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 rounded-full border-2 border-white/30">
          {candidate.profile?.profilePhoto ? (
            <AvatarImage src={candidate.profile.profilePhoto} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-2xl">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <h3 className="mt-4 text-lg font-semibold text-white">
          {candidate.fullname || 'Unnamed'}
        </h3>
        <p className="text-sm text-gray-300">{candidate.email}</p>
        <p className="mt-2 text-sm text-purple-200">Hired for: <span className="font-semibold text-white">{jobTitle}</span></p>
      </div>
      <div className="flex justify-center mt-6">
        <Button variant="outline" className="flex items-center gap-1 border-white/30 text-white hover:bg-white/20">
          View Profile <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CandidateCard;
