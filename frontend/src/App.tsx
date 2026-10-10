import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from './lib/api';

type UserType = 'Student' | 'Customer' | 'Other';
type EnquiryStatus = 'New' | 'Contacted' | 'In Progress' | 'Closed';

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  user_type: UserType;
  interest: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  user_type: UserType;
  interest: string;
  message: string;
};

type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

type ChatMessage = {
  id: number;
  sender: 'user' | 'bot';
  text: string;
};

const defaultForm: FormState = {
  name: '',
  email: '',
  phone: '',
  user_type: 'Student',
  interest: '',
  message: '',
};

const quickReplies = [
  'What services do you offer?',
  'Tell me about your training courses',
  'How do I register for a course?',
  'I want to speak to a human',
  'How do I contact the team?',
];

const services = [
  {
    title: 'Drone Operations Support',
    description: 'Guidance for planning, compliance, and operational support for aerial projects and business workflows.',
  },
  {
    title: 'AI Automation Assistance',
    description: 'Advice on integrating AI workflows, support chat experiences, and digital engagement tools for business teams.',
  },
  {
    title: 'Lead & Enquiry Management',
    description: 'Support for capturing, organising, and responding to customer, student, and partner enquiries efficiently.',
  },
];

const courses = [
  'Introductory drone operations',
  'Commercial flight planning and safety',
  'Aerial photography and media workflows',
  'AI-powered customer support foundations',
  'Operational readiness and enquiry handling',
];

const statusOptions: EnquiryStatus[] = ['New', 'Contacted', 'In Progress', 'Closed'];
const userTypeOptions: UserType[] = ['Student', 'Customer', 'Other'];

function getChatReply(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('service') || normalized.includes('services')) {
    return 'We support drone operations guidance, AI automation assistance, and lead/enquiry management workflows. You can ask about a specific service or submit an enquiry for a tailored recommendation.';
  }

  if (normalized.includes('course') || normalized.includes('training')) {
    return 'Our training topics include introductory drone operations, commercial flight planning, aerial media workflows, AI-powered support foundations, and operational readiness. You can register through the enquiry form.';
  }

  if (normalized.includes('contact') || normalized.includes('email') || normalized.includes('phone')) {
    return 'The quickest way to reach our team is to submit an enquiry using the form on this page. We will review your request and follow up with the right guidance.';
  }

  if (normalized.includes('register') || normalized.includes('enrol') || normalized.includes('enroll')) {
    return 'To register your interest, use the enquiry form and select the relevant course or service. Include your contact details and we will guide the next steps.';
  }

  if (normalized.includes('human') || normalized.includes('representative')) {
    return 'You can request a human representative through the enquiry form. We will route your request to the appropriate team member.';
  }

  if (normalized.includes('student') || normalized.includes('customer')) {
    return 'We support both students and customers with training, service guidance, and enquiry support. Choose the relevant option in the contact form to help us route your request correctly.';
  }

  if (normalized.includes('hello') || normalized.includes('hi')) {
    return 'Hello! I can help with services, courses, registration, and enquiry support. Ask me anything about the DroneTV experience or submit a request through the form.';
  }

  return 'I can help with service details, training courses, registration, and contact options. If you are unsure, simply submit an enquiry and our team will respond with next steps.';
}

function formatDate(value: string): string {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function App() {
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! I can help answer questions about services, courses, registration, and enquiry support.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EnquiryStatus>('All');
  const [userTypeFilter, setUserTypeFilter] = useState<'All' | UserType>('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    next_page_url: null,
    prev_page_url: null,
  });

  const fetchEnquiries = useCallback(
    async (pageNumber = 1, nextSearch = searchQuery) => {
      if (!adminToken.trim()) {
        setEnquiries([]);
        setAdminError('Enter the admin access token to load enquiries.');
        return;
      }

      setAdminLoading(true);
      setAdminError('');

      try {
        const params = new URLSearchParams();
        if (nextSearch.trim()) {
          params.set('search', nextSearch.trim());
        }
        if (statusFilter !== 'All') {
          params.set('status', statusFilter);
        }
        if (userTypeFilter !== 'All') {
          params.set('user_type', userTypeFilter);
        }
        params.set('page', String(pageNumber));
        params.set('per_page', '10');

        const response = await apiRequest<{
          success: boolean;
          data: Enquiry[];
          pagination: PaginationMeta;
        }>(`/api/enquiries?${params.toString()}`, {
          method: 'GET',
          adminToken,
        });

        setEnquiries(response.data);
        setPagination(response.pagination);
        setSelectedEnquiry((current) => {
          if (response.data.length === 0) {
            return null;
          }

          if (current && response.data.some((item) => item.id === current.id)) {
            return current;
          }

          return response.data[0];
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch enquiries.';
        setAdminError(message);
        setEnquiries([]);
      } finally {
        setAdminLoading(false);
      }
    },
    [adminToken, searchQuery, statusFilter, userTypeFilter],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEnquiries(page, searchQuery);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [adminToken, fetchEnquiries, page, searchQuery, statusFilter, userTypeFilter]);

  useEffect(() => {
    if (!adminError) {
      return;
    }

    const timer = window.setTimeout(() => setAdminError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [adminError]);

  const validateForm = (): Partial<Record<keyof FormState, string>> => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.';
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters long.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!/^[0-9+()\-\s]{8,20}$/.test(formData.phone.trim())) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    if (!formData.interest.trim()) {
      nextErrors.interest = 'Please enter the area of interest.';
    }

    if (!formData.message.trim()) {
      nextErrors.message = 'Please add a message.';
    } else if (formData.message.trim().length < 10) {
      nextErrors.message = 'Please provide a bit more detail so we can help.';
    }

    return nextErrors;
  };

  const handleFormFieldChange = (field: keyof FormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitState('loading');
    setSubmitMessage('');

    try {
      await apiRequest<{ success: boolean; message: string }>('/api/enquiries', {
        method: 'POST',
        body: formData,
      });

      setSubmitState('success');
      setSubmitMessage('Your enquiry has been submitted successfully. Our team will be in touch soon.');
      setFormData(defaultForm);
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Something went wrong while sending your enquiry.',
      );
    }
  };

  const handleBotSubmit = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    const response = getChatReply(trimmed);
    const newUserMessage: ChatMessage = { id: Date.now(), sender: 'user', text: trimmed };
    const newBotMessage: ChatMessage = { id: Date.now() + 1, sender: 'bot', text: response };
    setChatMessages((current) => [...current, newUserMessage, newBotMessage]);
    setChatInput('');
  };

  const handleStatusUpdate = async (id: number, status: EnquiryStatus) => {
    try {
      const response = await apiRequest<{ success: boolean; data: Enquiry; message: string }>(
        `/api/enquiries/${id}`,
        {
          method: 'PATCH',
          adminToken,
          body: { status },
        },
      );

      const nextItems = enquiries.map((item) => (item.id === id ? response.data : item));
      setEnquiries(nextItems);
      setSelectedEnquiry(response.data);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Unable to update enquiry status.');
    }
  };

  const handleDeleteEnquiry = async (id: number) => {
    const confirmed = window.confirm('Delete this enquiry? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/api/enquiries/${id}`, {
        method: 'DELETE',
        adminToken,
      });
      const nextItems = enquiries.filter((item) => item.id !== id);
      setEnquiries(nextItems);
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(nextItems[0] || null);
      }
      setAdminError('');
      void fetchEnquiries(page, searchQuery);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Unable to delete the enquiry.');
    }
  };

  return (
    <div className="app-shell">
      {adminError && (
        <div className="toast-alert" role="alert">
          <span>{adminError}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setAdminError('')}>
            ×
          </button>
        </div>
      )}
      <header className="topbar">
        <div className="brand-wrap">
          <img className="brand-mark" src="/logo.svg" alt="DroneTV logo" />
          <div>
            <div className="brand-name">DroneTV</div>
            <div className="eyebrow">AI support & lead assistant</div>
          </div>
        </div>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#courses">Courses</a>
          <a href="#contact">Contact</a>
          <a href="#chatbot">Chatbot</a>
          <a href="#admin">Admin</a>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="badge">Operations support · training · AI assistance</span>
            <h1>Business-ready drone and AI support for your next opportunity.</h1>
            <p>
              We help teams plan, train, and communicate clearly about drone services, operational readiness,
              and digital support workflows.
            </p>
            <div className="cta-row">
              <a href="#contact" className="button primary">Request a callback</a>
              <a href="#chatbot" className="button secondary">Try the chatbot</a>
            </div>
            <ul className="highlights">
              <li>Practical training pathways</li>
              <li>Clear enquiry management</li>
              <li>Responsive team support</li>
            </ul>
          </div>
          <div className="hero-panel">
            <div className="panel-card">
              <span className="mini-label">Service snapshot</span>
              <h3>Support that is clear, practical, and action-focused.</h3>
              <div className="metric-row">
                <div>
                  <strong>3</strong>
                  <span>Core service lines</span>
                </div>
                <div>
                  <strong>5</strong>
                  <span>Course themes</span>
                </div>
              </div>
              <ul>
                <li>Operational planning guidance</li>
                <li>AI support workflows</li>
                <li>Customer and student enquiry handling</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="services" className="content-section">
          <div className="section-heading">
            <span className="eyebrow accent">Services</span>
            <h2>Support designed around action and clarity.</h2>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article key={service.title} className="info-card">
                <div className="card-icon">✦</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="courses" className="content-section alt-section">
          <div className="section-heading">
            <span className="eyebrow accent">Courses & training</span>
            <h2>Build confidence in drone operations and digital support skills.</h2>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course} className="course-pill">
                {course}
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="content-section contact-layout">
          <div className="contact-copy">
            <span className="eyebrow accent">Contact</span>
            <h2>Tell us what you need.</h2>
            <p>
              Whether you are a student, customer, or partner, we can guide you on the right training, support,
              or enquiry route.
            </p>
            <div className="contact-points">
              <div>
                <label>Response time</label>
                <strong>Usually within one business day</strong>
              </div>
              <div>
                <label>Best for</label>
                <strong>Training, service questions, and support requests</strong>
              </div>
            </div>
          </div>

          <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
            <div className="field-grid">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleFormFieldChange('name', event.target.value)}
                  placeholder="Your full name"
                />
                {validationErrors.name && <small>{validationErrors.name}</small>}
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleFormFieldChange('email', event.target.value)}
                  placeholder="name@example.com"
                />
                {validationErrors.email && <small>{validationErrors.email}</small>}
              </label>

              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleFormFieldChange('phone', event.target.value)}
                  placeholder="+123456789"
                />
                {validationErrors.phone && <small>{validationErrors.phone}</small>}
              </label>

              <label>
                <span>User type</span>
                <select
                  value={formData.user_type}
                  onChange={(event) => handleFormFieldChange('user_type', event.target.value as UserType)}
                >
                  {userTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                <span>Interest</span>
                <input
                  type="text"
                  value={formData.interest}
                  onChange={(event) => handleFormFieldChange('interest', event.target.value)}
                  placeholder="Service or course of interest"
                />
                {validationErrors.interest && <small>{validationErrors.interest}</small>}
              </label>

              <label className="full-width">
                <span>Message</span>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(event) => handleFormFieldChange('message', event.target.value)}
                  placeholder="Share your goals or questions"
                />
                {validationErrors.message && <small>{validationErrors.message}</small>}
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button primary" disabled={submitState === 'loading'}>
                {submitState === 'loading' ? 'Sending...' : 'Submit enquiry'}
              </button>
            </div>

            {submitMessage && (
              <div className={`status-banner ${submitState === 'success' ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}
          </form>
        </section>

        <section id="chatbot" className="content-section chatbot-section">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow accent">Chatbot</span>
              <h2>Need quick guidance?</h2>
            </div>
            <button
              type="button"
              className="button secondary small-button"
              onClick={() => setChatMessages([{ id: Date.now(), sender: 'bot', text: 'Conversation reset. Ask about services, training, or enrolment.' }])}
            >
              Clear chat
            </button>
          </div>

          <div className="chatbot-card">
            <div className="chat-window">
              {chatMessages.map((message) => (
                <div key={message.id} className={`chat-bubble ${message.sender}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply} type="button" onClick={() => setChatInput(reply)}>
                  {reply}
                </button>
              ))}
            </div>
            <div className="chat-input-row">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask a question..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleBotSubmit();
                  }
                }}
              />
              <button type="button" className="button primary" onClick={handleBotSubmit}>
                Send
              </button>
            </div>
          </div>
        </section>

        <section id="admin" className="content-section admin-section">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow accent">Admin dashboard</span>
              <h2>Review and manage enquiries</h2>
            </div>
            <div className="admin-token-box">
              <span>Admin key</span>
              <input
                type="password"
                value={adminToken}
                onChange={(event) => setAdminToken(event.target.value)}
                placeholder="Enter admin access token"
              />
            </div>
          </div>

          <div className="admin-toolbar">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setPage(1);
                setSearchQuery(event.target.value);
              }}
              placeholder="Search by name, email, interest..."
            />
            <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value as 'All' | EnquiryStatus); }}>
              <option value="All">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={userTypeFilter} onChange={(event) => { setPage(1); setUserTypeFilter(event.target.value as 'All' | UserType); }}>
              <option value="All">All user types</option>
              {userTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-layout">
            <div className="table-wrap">
              {adminLoading ? (
                <div className="empty-state">Loading enquiries...</div>
              ) : enquiries.length === 0 ? (
                <div className="empty-state">No enquiries match your current filters.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>User</th>
                      <th>Interest</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr
                        key={enquiry.id}
                        className={selectedEnquiry?.id === enquiry.id ? 'selected-row' : ''}
                        onClick={() => setSelectedEnquiry(enquiry)}
                      >
                        <td>{enquiry.name}</td>
                        <td>{enquiry.user_type}</td>
                        <td>{enquiry.interest}</td>
                        <td>{enquiry.status}</td>
                        <td>{formatDate(enquiry.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {pagination.total > 0 && (
                <div className="pagination-row">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Previous
                  </button>
                  <span>
                    Page {page} / {pagination.last_page}
                  </span>
                  <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>
                    Next
                  </button>
                </div>
              )}
            </div>

            {selectedEnquiry ? (
              <aside className="detail-panel">
                <h3>{selectedEnquiry.name}</h3>
                <div className="detail-grid">
                  <div>
                    <span>Email</span>
                    <strong>{selectedEnquiry.email}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{selectedEnquiry.phone}</strong>
                  </div>
                  <div>
                    <span>User type</span>
                    <strong>{selectedEnquiry.user_type}</strong>
                  </div>
                  <div>
                    <span>Interest</span>
                    <strong>{selectedEnquiry.interest}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selectedEnquiry.status}</strong>
                  </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatDate(selectedEnquiry.created_at)}</strong>
                  </div>
                </div>

                <p className="message-box">{selectedEnquiry.message}</p>

                <div className="status-actions">
                  <label>
                    <span>Update status</span>
                    <select
                      value={selectedEnquiry.status}
                      onChange={(event) => handleStatusUpdate(selectedEnquiry.id, event.target.value as EnquiryStatus)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="button danger" onClick={() => handleDeleteEnquiry(selectedEnquiry.id)}>
                    Delete enquiry
                  </button>
                </div>
              </aside>
            ) : (
              <aside className="detail-panel empty-panel">Select an enquiry to review the details.</aside>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} DroneTV. All rights reserved.</span>
        <span>
          Designed &amp; developed by <strong>Chandan</strong>
        </span>
      </footer>
    </div>
  );
}

export default App;
