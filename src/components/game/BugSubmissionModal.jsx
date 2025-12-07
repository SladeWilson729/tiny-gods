import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Upload } from 'lucide-react';

export default function BugSubmissionModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [godName, setGodName] = useState('');
  const [whenHappens, setWhenHappens] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [allGods, setAllGods] = useState([]);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    if (open) {
      loadGods();
      const page = window.location.pathname.split('/').pop() || 'Home';
      setCurrentPage(page);
    }
  }, [open]);

  const loadGods = async () => {
    try {
      const gods = await base44.entities.God.list();
      setAllGods(gods);
    } catch (error) {
      console.error('Failed to load gods:', error);
    }
  };

  const handleScreenshotChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingScreenshot(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshotUrl(file_url);
      setScreenshot(file);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      alert('Failed to upload screenshot. Please try again.');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.BugReport.create({
        title,
        description,
        god_name: godName || 'Not specified',
        when_happens: whenHappens || 'Not specified',
        screenshot_url: screenshotUrl || null,
        page: currentPage,
        status: 'open',
        reporter_email: user.email,
        reporter_name: user.full_name || user.email
      });

      setIsSubmitted(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      alert("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGodName('');
    setWhenHappens('');
    setScreenshot(null);
    setScreenshotUrl('');
    setIsSubmitted(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Report a Bug</DialogTitle>
          <DialogDescription className="text-gray-300">
            Help us improve the game by reporting any issues you encounter. The more details you provide, the faster we can fix it!
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-lg text-green-400">Bug report submitted successfully!</p>
            <p className="text-sm text-gray-400 mt-2">Thank you for helping us improve Tiny Gods!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the bug"
                className="bg-black/30 border-purple-800 text-white placeholder:text-gray-400"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                What screen are you on?
              </label>
              <Input
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="e.g., Combat, Home, GodSelection"
                className="bg-black/30 border-purple-800 text-white placeholder:text-gray-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-400 mt-1">Auto-detected: {currentPage}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                What God are you playing?
              </label>
              <Select value={godName} onValueChange={setGodName} disabled={isSubmitting}>
                <SelectTrigger className="bg-black/30 border-purple-800 text-white">
                  <SelectValue placeholder="Select a god (or skip if not applicable)" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-purple-700">
                  <SelectItem value="Not applicable" className="text-white">Not applicable</SelectItem>
                  {allGods.map(god => (
                    <SelectItem key={god.id} value={god.name} className="text-white">
                      {god.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                When does this happen?
              </label>
              <Textarea
                value={whenHappens}
                onChange={(e) => setWhenHappens(e.target.value)}
                placeholder="Describe the steps to reproduce (e.g., 'After playing my 3rd card in battle 5...')"
                className="bg-black/30 border-purple-800 h-24 text-white placeholder:text-gray-400"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Detailed Description <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible about what's wrong and what you expected to happen..."
                className="bg-black/30 border-purple-800 h-32 text-white placeholder:text-gray-400"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Screenshot (Optional)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  disabled={isSubmitting || isUploadingScreenshot}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isUploadingScreenshot || isSubmitting
                      ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                      : 'border-purple-600 bg-purple-900/20 hover:bg-purple-900/40'
                  }`}
                >
                  {isUploadingScreenshot ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="text-purple-400">Uploading screenshot...</span>
                    </>
                  ) : screenshotUrl ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">Screenshot uploaded!</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-400">Click to upload screenshot</span>
                    </>
                  )}
                </label>
                
                {screenshotUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-purple-700">
                    <img src={screenshotUrl} alt="Screenshot preview" className="w-full h-48 object-contain bg-black/60" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setScreenshot(null);
                        setScreenshotUrl('');
                      }}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-purple-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isUploadingScreenshot}
                className="border-purple-500 text-white hover:bg-purple-500/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingScreenshot || !title || !description}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Bug Report'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}