// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Certificate {

    struct Cert {
        string certificateId;
        string studentName;
        string course;
        string ipfsHash;
        string fileHash;
    }

    mapping(string => Cert) public certificates;

    function issueCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _course,
        string memory _ipfsHash,
        string memory _fileHash
    ) public {

        certificates[_certificateId] = Cert(
            _certificateId,
            _studentName,
            _course,
            _ipfsHash,
            _fileHash
        );
    }

    function verifyCertificate(string memory _certificateId)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        Cert memory cert = certificates[_certificateId];

        return (
            cert.certificateId,
            cert.studentName,
            cert.course,
            cert.ipfsHash,
            cert.fileHash
        );
    }
}