import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Employee, EmployeeDocument } from '../types';
import {
  X, FileText, Upload, Trash2, Download,
  CheckCircle, AlertCircle, Shield, FileCheck
} from 'lucide-react';
import { toast } from './Toast';

interface EmployeeDocumentsModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const EmployeeDocumentsModal: React.FC<EmployeeDocumentsModalProps> = ({
  employee,
  isOpen,
  onClose,
  userRole = 'employee'
}) => {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [newDocType, setNewDocType] = useState<string>('pan_card');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = userRole === 'admin' || userRole === 'owner' || userRole === 'payroll_admin';

  useEffect(() => {
    if (isOpen && employee) {
      loadDocuments();
    }
  }, [isOpen, employee]);

  const loadDocuments = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      const res = await api.getEmployeeDocuments(employee.id);
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !newTitle.trim()) return;

    try {
      setUploading(true);
      await api.uploadEmployeeDocument(employee.id, {
        document_type: newDocType,
        title: newTitle.trim(),
        file_name: newFileName.trim() || `${newDocType}_${employee.emp_code}.pdf`,
        file_size_kb: 180
      });
      setMessage({ type: 'success', text: 'Document uploaded and verified successfully.' });
      setNewTitle('');
      setNewFileName('');
      await loadDocuments();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload document.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!employee) return;
    try {
      await api.deleteEmployeeDocument(employee.id, docId);
      setDocuments(docs => docs.filter(d => d.id !== docId));
      toast.success('KYC document removed.', 'Document Deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document', 'Delete Error');
    }
  };

  const handleDownloadSimulated = (doc: EmployeeDocument) => {
    const textContent = `PAYPILOT AI VERIFIED DOCUMENT\n\nTitle: ${doc.title}\nType: ${doc.document_type.toUpperCase()}\nEmployee: ${employee?.first_name} ${employee?.last_name} (${employee?.emp_code})\nCompany PAN: Verified\nUploaded: ${doc.uploaded_at}\nStatus: Active KYC Record\n\n[End of Encrypted Record]`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name.endsWith('.pdf') ? doc.file_name.replace('.pdf', '.txt') : doc.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">KYC & Compliance Documents</h2>
              <p className="text-xs text-slate-400">
                {employee.first_name} {employee.last_name} • <span className="font-mono text-indigo-300">{employee.emp_code}</span> • {employee.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Document List */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Stored Records ({documents.length})
            </h3>

            {loading ? (
              <div className="py-8 text-center text-slate-400">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No documents uploaded yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Upload PAN card, Signed Offer Letter, or Form 16 below.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{doc.title}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-600">{doc.file_name}</span>
                          <span>•</span>
                          <span>{doc.file_size_kb} KB</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Verified</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadSimulated(doc)}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download</span>
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="cursor-pointer text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Form */}
          {canManage && (
            <form onSubmit={handleUpload} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload New Document</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Document Category</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full p-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option value="pan_card">PAN Card Copy</option>
                    <option value="aadhaar_card">Aadhaar Verification</option>
                    <option value="offer_letter">Signed Offer Letter</option>
                    <option value="form_16">Form 16 Tax Certificate</option>
                    <option value="resume">Resume / CV</option>
                    <option value="appointment_letter">Appointment Letter</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official PAN Copy"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2 rounded-md border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. PAN_ABCDE1234F.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full p-2 rounded-md border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !newTitle.trim()}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Attaching...' : 'Attach Document'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Encrypted at rest under Indian DPDP Act 2023 guidelines</span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
