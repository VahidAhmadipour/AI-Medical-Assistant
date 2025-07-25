/**
 * Clinical AI Support System - Main JavaScript File
 * Handles frontend interactivity for the healthcare application
 */

// Global variables
let currentChatContext = null;
let searchTimeout = null;

// Document ready initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize Bootstrap tooltips
    initializeTooltips();
    
    // Initialize chat functionality
    initializeChat();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize auto-refresh for alerts
    initializeAlertRefresh();
    
    console.log('Clinical AI Support System initialized');
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Initialize AI chat functionality
 */
function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatInput && sendChatBtn) {
        // Send message on button click
        sendChatBtn.addEventListener('click', sendChatMessage);
        
        // Send message on Enter key press
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

/**
 * Send chat message to AI
 */
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input and show loading
    chatInput.value = '';
    showChatLoading();
    
    // Send to backend
    fetch('/ai-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            patient_id: currentChatContext
        })
    })
    .then(response => response.json())
    .then(data => {
        hideChatLoading();
        addMessageToChat('ai', data.response, data.suggestions);
        
        // Handle any actions suggested by AI
        if (data.action) {
            handleAIAction(data.action, data.priority);
        }
    })
    .catch(error => {
        hideChatLoading();
        console.error('Chat error:', error);
        addMessageToChat('ai', 'I apologize, but I encountered an error. Please try again.');
    });
}

/**
 * Add message to chat interface
 */
function addMessageToChat(sender, message, suggestions = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender} mb-3`;
    
    let messageContent = `
        <div class="d-flex align-items-start">
            <div class="me-2">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'} text-${sender === 'user' ? 'primary' : 'success'}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="fw-bold mb-1">${sender === 'user' ? 'You' : 'AI Assistant'}</div>
                <div class="message-text">${message}</div>
    `;
    
    // Add suggestions if provided
    if (suggestions && suggestions.length > 0) {
        messageContent += `
            <div class="mt-2">
                <small class="text-muted">Suggestions:</small>
                <ul class="list-unstyled mt-1">
        `;
        suggestions.forEach(suggestion => {
            messageContent += `<li><small class="text-muted">• ${suggestion}</small></li>`;
        });
        messageContent += `</ul></div>`;
    }
    
    messageContent += `
                <small class="text-muted">${new Date().toLocaleTimeString()}</small>
            </div>
        </div>
    `;
    
    messageDiv.innerHTML = messageContent;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show chat loading indicator
 */
function showChatLoading() {
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'chatLoading';
    loadingDiv.className = 'chat-message ai mb-3';
    loadingDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-2">
                <i class="fas fa-robot text-success"></i>
            </div>
            <div class="flex-grow-1">
                <div class="fw-bold mb-1">AI Assistant</div>
                <div class="d-flex align-items-center">
                    <div class="loading-spinner me-2"></div>
                    <span class="text-muted">Thinking...</span>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Hide chat loading indicator
 */
function hideChatLoading() {
    const loadingDiv = document.getElementById('chatLoading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Handle AI suggested actions
 */
function handleAIAction(action, priority) {
    if (priority === 'urgent') {
        showNotification('Urgent action required: ' + action, 'danger');
    } else if (priority === 'high') {
        showNotification('High priority: ' + action, 'warning');
    }
}

/**
 * Set chat context for patient-specific conversations
 */
function setChatContext(patientId) {
    currentChatContext = patientId;
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        addMessageToChat('ai', `Chat context set for patient. You can now ask questions about this patient's care.`);
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const patientSearchInput = document.getElementById('patientSearch');
    
    if (patientSearchInput) {
        patientSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2) {
                    performPatientSearch(this.value);
                } else {
                    clearSearchResults();
                }
            }, 300);
        });
    }
}

/**
 * Perform patient search
 */
function performPatientSearch(query) {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    // Show loading
    searchResults.innerHTML = '<div class="text-center p-3"><div class="loading-spinner"></div> Searching...</div>';
    
    fetch(`/search-patients?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(patients => {
            displaySearchResults(patients);
        })
        .catch(error => {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="alert alert-danger">Error searching patients. Please try again.</div>';
        });
}

/**
 * Display search results
 */
function displaySearchResults(patients) {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    if (patients.length === 0) {
        searchResults.innerHTML = '<div class="alert alert-info">No patients found matching your search.</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    patients.forEach(patient => {
        html += `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${escapeHtml(patient.name)}</h6>
                        <small class="text-muted">ID: ${escapeHtml(patient.tracking_number)}</small>
                    </div>
                    <span class="badge bg-${getStatusBadgeColor(patient.status)}">${escapeHtml(patient.status)}</span>
                </div>
                <div class="mt-2">
                    <a href="/patient/${patient.id}" class="btn btn-sm btn-outline-primary me-2">
                        <i class="fas fa-eye"></i> View Details
                    </a>
                    <button class="btn btn-sm btn-outline-success me-2" onclick="generateSummary(${patient.id})">
                        <i class="fas fa-robot"></i> AI Summary
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="setChatContext(${patient.id}); openAIChat()">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    searchResults.innerHTML = html;
}

/**
 * Clear search results
 */
function clearSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = '';
    }
}

/**
 * Get badge color for patient status
 */
function getStatusBadgeColor(status) {
    switch(status) {
        case 'discharged': return 'success';
        case 'in_treatment': return 'primary';
        case 'registered': return 'secondary';
        default: return 'secondary';
    }
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
    // Handle patient registration form
    const patientForm = document.getElementById('patientRegistrationForm');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientRegistration);
    }
    
    // Handle other forms as needed
    initializeGenericFormHandlers();
}

/**
 * Handle patient registration
 */
function handlePatientRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner me-2"></div>Registering...';
    }
    
    fetch('/register-patient', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('Registration failed');
    })
    .then(data => {
        showNotification('Patient registered successfully!', 'success');
        // Close modal if exists
        const modal = bootstrap.Modal.getInstance(document.getElementById('patientRegistrationModal'));
        if (modal) {
            modal.hide();
        }
        // Refresh page or update UI
        setTimeout(() => {
            location.reload();
        }, 1000);
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('Error registering patient. Please try again.', 'danger');
    })
    .finally(() => {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Register Patient';
        }
    });
}

/**
 * Initialize generic form handlers
 */
function initializeGenericFormHandlers() {
    // Handle any forms with data-ajax attribute
    const ajaxForms = document.querySelectorAll('form[data-ajax]');
    ajaxForms.forEach(form => {
        form.addEventListener('submit', handleAjaxForm);
    });
}

/**
 * Handle AJAX form submission
 */
function handleAjaxForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const url = form.action || window.location.href;
    const method = form.method || 'POST';
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Operation completed successfully!', 'success');
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } else {
            showNotification(data.error || 'Operation failed. Please try again.', 'danger');
        }
    })
    .catch(error => {
        console.error('Form error:', error);
        showNotification('An error occurred. Please try again.', 'danger');
    });
}

/**
 * Initialize alert refresh functionality
 */
function initializeAlertRefresh() {
    // Auto-refresh alerts every 5 minutes
    setInterval(() => {
        refreshAlerts();
    }, 300000);
}

/**
 * Refresh alerts
 */
function refreshAlerts() {
    // This would typically fetch new alerts from the server
    // For now, we'll just log that it's running
    console.log('Refreshing alerts...');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate patient summary using AI
 */
function generateSummary(patientId) {
    const modal = new bootstrap.Modal(document.getElementById('aiChatModal'));
    const messagesDiv = document.getElementById('chatMessages');
    
    // Clear chat and show loading
    messagesDiv.innerHTML = '';
    addMessageToChat('ai', 'Generating patient summary...');
    showChatLoading();
    
    fetch(`/generate-summary/${patientId}`)
        .then(response => response.json())
        .then(data => {
            hideChatLoading();
            
            // Display summary in a formatted way
            const summaryHtml = `
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-file-medical me-2"></i>AI Generated Patient Summary</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Clinical Summary:</strong>
                            <p class="mt-1">${escapeHtml(data.summary)}</p>
                        </div>
                        
                        ${data.key_points && data.key_points.length > 0 ? `
                        <div class="mb-3">
                            <strong>Key Points:</strong>
                            <ul class="mt-1">
                                ${data.key_points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        ${data.recommendations && data.recommendations.length > 0 ? `
                        <div class="mb-3">
                            <strong>Recommendations:</strong>
                            <ul class="mt-1">
                                ${data.recommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            messagesDiv.innerHTML = summaryHtml;
            setChatContext(patientId);
        })
        .catch(error => {
            hideChatLoading();
            console.error('Summary generation error:', error);
            addMessageToChat('ai', 'I apologize, but I encountered an error generating the summary. Please try again.');
        });
    
    modal.show();
}

/**
 * Open AI chat modal
 */
function openAIChat() {
    const modal = new bootstrap.Modal(document.getElementById('aiChatModal'));
    modal.show();
    
    // Focus on input when modal opens
    document.getElementById('aiChatModal').addEventListener('shown.bs.modal', function () {
        document.getElementById('chatInput').focus();
    });
}

/**
 * Update treatment order status
 */
function updateOrderStatus(orderId, status) {
    if (!confirm(`Are you sure you want to mark this order as ${status}?`)) {
        return;
    }
    
    fetch('/update-order-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_id: orderId,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Order status updated successfully!', 'success');
            // Refresh the page or update the UI
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showNotification('Error updating order status: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status. Please try again.', 'danger');
    });
}

/**
 * Create treatment order
 */
function createTreatmentOrder(patientId, orderData) {
    return fetch('/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            patient_id: patientId,
            ...orderData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Treatment order created successfully!', 'success');
            return data;
        } else {
            throw new Error(data.error || 'Failed to create order');
        }
    })
    .catch(error => {
        console.error('Error creating order:', error);
        showNotification('Error creating treatment order: ' + error.message, 'danger');
        throw error;
    });
}

/**
 * Load patient data for quick access
 */
function loadPatientData(patientId) {
    return fetch(`/patient/${patientId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patient data');
            }
            return response.text();
        })
        .catch(error => {
            console.error('Error loading patient data:', error);
            showNotification('Error loading patient data.', 'danger');
            throw error;
        });
}

/**
 * Initialize page-specific functionality
 */
function initializePageSpecific() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/doctor-dashboard')) {
        initializeDoctorDashboard();
    } else if (currentPath.includes('/nurse-dashboard')) {
        initializeNurseDashboard();
    } else if (currentPath.includes('/admin-dashboard')) {
        initializeAdminDashboard();
    } else if (currentPath.includes('/patient/')) {
        initializePatientDetails();
    }
}

/**
 * Initialize doctor dashboard specific functionality
 */
function initializeDoctorDashboard() {
    // Auto-refresh pending orders every 2 minutes
    setInterval(() => {
        refreshPendingOrders();
    }, 120000);
}

/**
 * Initialize nurse dashboard specific functionality
 */
function initializeNurseDashboard() {
    // Auto-refresh assigned tasks every 1 minute
    setInterval(() => {
        refreshAssignedTasks();
    }, 60000);
}

/**
 * Initialize admin dashboard specific functionality
 */
function initializeAdminDashboard() {
    // Auto-refresh system statistics every 5 minutes
    setInterval(() => {
        refreshSystemStats();
    }, 300000);
}

/**
 * Initialize patient details specific functionality
 */
function initializePatientDetails() {
    // Initialize timeline interactions
    initializeTimeline();
}

/**
 * Initialize timeline functionality
 */
function initializeTimeline() {
    // Add click handlers for timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.addEventListener('click', function() {
            // Add any timeline-specific functionality here
            console.log('Timeline item clicked');
        });
    });
}

/**
 * Refresh functions for auto-updates
 */
function refreshPendingOrders() {
    console.log('Refreshing pending orders...');
    // Implementation would fetch and update pending orders
}

function refreshAssignedTasks() {
    console.log('Refreshing assigned tasks...');
    // Implementation would fetch and update assigned tasks
}

function refreshSystemStats() {
    console.log('Refreshing system statistics...');
    // Implementation would fetch and update system stats
}

// Initialize page-specific functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializePageSpecific();
});

// Export functions for global access
window.ClinicalAI = {
    sendChatMessage,
    setChatContext,
    generateSummary,
    openAIChat,
    updateOrderStatus,
    createTreatmentOrder,
    loadPatientData,
    showNotification,
    performPatientSearch
};
