import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BugReports() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadBugs = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }
        setIsAdmin(true);

        const allBugs = await base44.entities.BugReport.list('-created_date');
        setBugs(allBugs);
      } catch (error) {
        console.error("Failed to load bug reports:", error);
        navigate(createPageUrl('Home'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBugs();
  }, [navigate]);

  const updateStatus = async (bugId, newStatus) => {
    try {
      await base44.entities.BugReport.update(bugId, { status: newStatus });
      setBugs(prevBugs =>
        prevBugs.map(bug =>
          bug.id === bugId ? { ...bug, status: newStatus } : bug
        )
      );
    } catch (error) {
      console.error("Failed to update bug status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 mb-2">
            Bug Reports
          </h1>
          <p className="text-lg text-purple-300">
            {bugs.length} total reports
          </p>
        </motion.div>

        {bugs.length === 0 ? (
          <Card className="bg-black/40 border-purple-800 p-8 text-center">
            <p className="text-gray-400 text-lg">No bug reports submitted yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bugs.map((bug, index) => (
              <motion.div
                key={bug.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-black/40 border-purple-800">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <CardTitle className="text-xl text-white mb-2">
                          {bug.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                          <span>Page: <span className="text-purple-300">{bug.page}</span></span>
                          <span>•</span>
                          <span>By: <span className="text-purple-300">{bug.reporter_name}</span></span>
                          <span>•</span>
                          <span>{new Date(bug.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(bug.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(bug.status)}
                          {bug.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 whitespace-pre-wrap">{bug.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Update Status:</span>
                      <Select
                        value={bug.status}
                        onValueChange={(value) => updateStatus(bug.id, value)}
                      >
                        <SelectTrigger className="w-40 bg-black/30 border-purple-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}