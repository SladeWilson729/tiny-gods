import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle, Music } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AudioUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.includes('audio')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select an audio file (.wav, .mp3, etc.)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(result.file_url);
      console.log('Uploaded file URL:', result.file_url);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full bg-black/40 border-purple-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-400" />
            Upload Background Music
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-purple-700 rounded-lg p-8 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer text-purple-300 hover:text-white transition-colors"
            >
              <Button asChild variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-500/20">
                <span>Choose Audio File</span>
              </Button>
            </label>
            {file && (
              <p className="mt-4 text-white">
                Selected: <span className="font-bold">{file.name}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Audio File
              </>
            )}
          </Button>

          {uploadedUrl && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-bold text-green-300">Upload Successful!</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">Your audio file URL:</p>
              <div className="bg-black/40 p-3 rounded border border-gray-700">
                <code className="text-xs text-purple-300 break-all">{uploadedUrl}</code>
              </div>
              <p className="text-sm text-yellow-300 mt-4">
                ⚠️ Copy this URL and send it to me. I'll update the Layout to use it!
              </p>
            </div>
          )}

          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-sm text-blue-300">
            <p className="font-bold mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Choose Audio File" and select your .wav file</li>
              <li>Click "Upload Audio File"</li>
              <li>Copy the generated URL</li>
              <li>Send me the URL so I can update the code</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}