package com.conggiasu.service;

import com.conggiasu.dto.response.PageResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

final class PaginationSupport {
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;

    private PaginationSupport() {
    }

    static PageRequest pageRequest(int page, int size) {
        return pageRequest(page, size, Sort.unsorted());
    }

    static PageRequest pageRequest(int page, int size, Sort sort) {
        return PageRequest.of(normalizePage(page), normalizeSize(size), sort == null ? Sort.unsorted() : sort);
    }

    static <T> PageResponse<T> toPageResponse(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
            .content(content)
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }

    private static int normalizePage(int page) {
        return Math.max(0, page);
    }

    private static int normalizeSize(int size) {
        if (size < 1) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }
}
