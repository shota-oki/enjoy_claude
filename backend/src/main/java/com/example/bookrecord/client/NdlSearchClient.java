package com.example.bookrecord.client;

import com.example.bookrecord.dto.BookSummary;
import com.example.bookrecord.exception.ExternalApiException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

/**
 * タイトルによる書誌情報検索（国立国会図書館サーチ SRU API、無償）。 openBDはISBN検索のみでタイトル検索に対応しないため、タイトル検索はこちらを利用する。
 */
@Component
public class NdlSearchClient {

    private static final String SRW_NS = "http://www.loc.gov/zing/srw/";
    private static final String DC_NS = "http://purl.org/dc/elements/1.1/";
    private static final String DCTERMS_NS = "http://purl.org/dc/terms/";
    private static final String FOAF_NS = "http://xmlns.com/foaf/0.1/";
    private static final String RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    private static final String ISBN_DATATYPE = "http://ndl.go.jp/dcndl/terms/ISBN";

    private final RestClient restClient;

    public NdlSearchClient(@Value("${app.ndl.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public List<BookSummary> searchByTitle(String title, int maxResults) {
        String query = "title=\"" + title.replace("\"", "") + "\"";
        String xml;
        try {
            xml =
                    restClient
                            .get()
                            .uri(
                                    uriBuilder ->
                                            uriBuilder
                                                    .path("/api/sru")
                                                    .queryParam("operation", "searchRetrieve")
                                                    .queryParam("query", query)
                                                    .queryParam("recordSchema", "dcndl")
                                                    .queryParam("maximumRecords", maxResults)
                                                    .build())
                            .retrieve()
                            .body(String.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("国立国会図書館サーチAPIとの通信に失敗しました", ex);
        }
        if (xml == null || xml.isBlank()) {
            return List.of();
        }
        try {
            return parseRecords(xml);
        } catch (Exception ex) {
            throw new ExternalApiException("国立国会図書館サーチAPIの応答解析に失敗しました", ex);
        }
    }

    private List<BookSummary> parseRecords(String xml) throws Exception {
        Document outer = parseXml(xml);
        NodeList recordDataNodes = outer.getElementsByTagNameNS(SRW_NS, "recordData");

        List<BookSummary> results = new ArrayList<>();
        for (int i = 0; i < recordDataNodes.getLength(); i++) {
            String innerXml = recordDataNodes.item(i).getTextContent();
            if (innerXml == null || innerXml.isBlank()) {
                continue;
            }
            Document inner = parseXml(innerXml);
            String title = firstText(inner, DCTERMS_NS, "title");
            if (title == null || title.isBlank()) {
                continue;
            }
            String author = firstText(inner, DC_NS, "creator");
            if (author == null) {
                author = firstNestedText(inner, DCTERMS_NS, "creator", FOAF_NS, "name");
            }
            String publisher = firstNestedText(inner, DCTERMS_NS, "publisher", FOAF_NS, "name");
            String isbn = findIsbn(inner);
            results.add(new BookSummary(isbn, title, author, publisher, null));
        }
        return results;
    }

    private Document parseXml(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    }

    private String firstText(Document doc, String ns, String localName) {
        NodeList nodes = doc.getElementsByTagNameNS(ns, localName);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent().trim() : null;
    }

    private String firstNestedText(
            Document doc, String outerNs, String outerLocal, String innerNs, String innerLocal) {
        NodeList outerNodes = doc.getElementsByTagNameNS(outerNs, outerLocal);
        if (outerNodes.getLength() == 0) {
            return null;
        }
        Node outerNode = outerNodes.item(0);
        if (!(outerNode instanceof Element outerElement)) {
            return null;
        }
        NodeList innerNodes = outerElement.getElementsByTagNameNS(innerNs, innerLocal);
        return innerNodes.getLength() > 0 ? innerNodes.item(0).getTextContent().trim() : null;
    }

    private String findIsbn(Document doc) {
        NodeList identifiers = doc.getElementsByTagNameNS(DCTERMS_NS, "identifier");
        for (int i = 0; i < identifiers.getLength(); i++) {
            Node node = identifiers.item(i);
            if (node instanceof Element element) {
                String datatype = element.getAttributeNS(RDF_NS, "datatype");
                if (ISBN_DATATYPE.equals(datatype)) {
                    return element.getTextContent().trim();
                }
            }
        }
        return null;
    }
}
