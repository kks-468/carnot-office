package kr.carnot.office.store;

import com.fasterxml.jackson.databind.node.ObjectNode;

/** 저장된 문서 하나. */
public record Rec(String kind, String id, String orgId, String projectId, ObjectNode data, long version) {}
