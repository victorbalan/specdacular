// Initialize Mermaid for diagrams
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose'
});

// Tab switching
document.addEventListener('DOMContentLoaded', function() {
  const tabLinks = document.querySelectorAll('.tab-link:not(.disabled)');

  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all tabs and content
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      // Re-render Mermaid diagrams in newly visible tab
      const section = document.getElementById(tabId);
      const diagrams = section.querySelectorAll('.mermaid');
      if (diagrams.length > 0) {
        mermaid.init(undefined, diagrams);
      }
    });
  });

  // Phase tab switching (within sections)
  document.querySelectorAll('.phase-tabs').forEach(tabContainer => {
    const tabs = tabContainer.querySelectorAll('.phase-tab');
    const section = tabContainer.closest('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active from all phase tabs in this section
        tabs.forEach(t => t.classList.remove('active'));

        // Add active to clicked tab
        this.classList.add('active');

        // Get phase to show
        const phase = this.getAttribute('data-phase');

        // Hide all phase content in this section
        section.querySelectorAll('.phase-content').forEach(content => {
          content.classList.remove('active');
        });

        // Show selected phase content
        if (phase === 'all') {
          // Show all phase content
          section.querySelectorAll('.phase-content').forEach(content => {
            content.classList.add('active');
          });
        } else {
          // Show only matching phase
          const targetContent = section.querySelector('.phase-content[data-phase="' + phase + '"]');
          if (targetContent) {
            targetContent.classList.add('active');
          }
        }
      });
    });
  });
});
