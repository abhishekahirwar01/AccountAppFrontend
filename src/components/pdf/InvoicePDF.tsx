import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import React from "react";

// Optional custom font or styling can go here

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: "left",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 10,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tableHeader: {
    backgroundColor: "#1d3557",
    color: "#fff",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    padding: 5,
  },
  cell: {
    flex: 1,
    paddingRight: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export const InvoicePDF = ({ transaction }: { transaction: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Invoice</Text>

      <View style={styles.section}>
        <Text>Client Name: Mark Thomas</Text>
        <Text>Company Name: FusionD Solutions</Text>
        <Text>Client Address: Street X, City X</Text>
        <Text>Phone Number: +00 000 000 000</Text>
      </View>

      <View style={styles.section}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.cell}>Quantity</Text>
          <Text style={styles.cell}>Item #</Text>
          <Text style={styles.cell}>Description</Text>
          <Text style={styles.cell}>Unit Price</Text>
          <Text style={styles.cell}>Total</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.cell}>1</Text>
          <Text style={styles.cell}>{transaction.id}</Text>
          <Text style={styles.cell}>{transaction.description}</Text>
          <Text style={styles.cell}>${transaction.amount}</Text>
          <Text style={styles.cell}>${transaction.amount}</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text>Subtotal: ${transaction.amount}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text>Sales Tax: $0</Text>
      </View>
      <View style={styles.totalRow}>
        <Text>TOTAL: ${transaction.amount}</Text>
      </View>

      <View style={[styles.section, { marginTop: 40 }]}>
        <Text>Signature </Text>
        <Text>Date:</Text>
        <Text>Payment Method:</Text>
      </View>

      <Text style={{ marginTop: 20, fontSize: 10 }}>
        Terms & Conditions: Lorem ipsum dolor sit amet, consectetur adipiscing
        elit...
      </Text>
    </Page>
  </Document>
);
