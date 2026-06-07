import React from "react";
import { Badge } from "./ui/badge";
import { ExternalLink, MapPin, Building2, Wifi, WifiOff } from "lucide-react";

const sourceColors = {
    Remotive: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Arbeitnow: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "The Muse": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const ExternalJobCard = ({ job }) => {
    return (
        <div className="p-5 rounded-xl shadow-sm dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-100 flex flex-col gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    {job.logo ? (
                        <img
                            src={job.logo}
                            alt={job.company}
                            className="w-10 h-10 rounded-lg object-contain border border-gray-100 dark:border-gray-700 bg-white p-1 shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{job.company}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{job.location}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-xs ${sourceColors[job.source] || "bg-gray-100 text-gray-600"}`}>
                        {job.source}
                    </Badge>
                    {job.isRemote ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Wifi className="w-3 h-3" /> Remote
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <WifiOff className="w-3 h-3" /> On-site
                        </span>
                    )}
                </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug line-clamp-2">
                {job.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
                {job.description}
            </p>

            {/* Tags */}
            {job.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {job.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <Badge variant="ghost" className="text-[#F83002] font-medium text-xs px-0">
                    {job.jobType}
                </Badge>
                <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#6A38C2] hover:underline"
                >
                    Apply Now <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
};

export default ExternalJobCard;
