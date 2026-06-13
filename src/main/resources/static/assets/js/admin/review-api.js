(function () {
  function endpointByKind(kind) {
    if (kind === 'tutor') return '/api/admin/tutors/pending';
    if (kind === 'post') return '/api/admin/posts/pending';
    if (kind === 'course') return '/api/admin/courses/pending';
    return '/api/admin/identity-verifications/pending';
  }

  async function loadDataset(kind, page, pageSize) {
    const data = await ApiClient.get(endpointByKind(kind), { page: page || 0, size: pageSize });
    return UiUtils.pageInfo(data);
  }

  async function review(kind, id, approved, rejectedReason) {
    const payload = { approved: approved, rejectedReason: rejectedReason };
    if (kind === 'tutor') {
      return ApiClient.patch('/api/admin/tutors/' + encodeURIComponent(id) + '/review', payload);
    }
    if (kind === 'post') {
      return ApiClient.patch('/api/admin/posts/' + encodeURIComponent(id) + '/review', payload);
    }
    if (kind === 'course') {
      return ApiClient.patch('/api/admin/courses/' + encodeURIComponent(id) + '/review', payload);
    }
    return ApiClient.patch('/api/admin/identity-verifications/' + encodeURIComponent(id) + '/review', payload);
  }

  async function loadTutorDetail(tutorId) {
    const encodedId = encodeURIComponent(tutorId);
    const [tutor, identity, certificates] = await Promise.all([
      ApiClient.get('/api/admin/tutors/' + encodedId + '/detail'),
      ApiClient.get('/api/admin/tutors/' + encodedId + '/identity-verification'),
      ApiClient.get('/api/admin/tutors/' + encodedId + '/certificates')
    ]);
    return {
      tutor: tutor || {},
      identity: identity || {},
      certificates: Array.isArray(certificates) ? certificates : []
    };
  }

  window.AdminReviewApi = {
    loadDataset: loadDataset,
    loadTutorDetail: loadTutorDetail,
    review: review
  };
})();
