// app/views/mvp/v6/admin/view.js
module.exports = (router) => {
  // Known references for the prototype
  const KNOWN_MRN  = '25GBB6DSB14ECR4AR9';
  const KNOWN_CHEDS = ['CHEDP.GB.2025.6679908', 'GBCHD2025.6679908'];

  // Patterns
  const mrnPattern  = /^25GB[A-Z0-9]{14}$/;                                   // 18 chars total
  const chedPattern = /^(CHED(P|PP)?\.GB\.\d{4}\.\d+|GBCHD\d{4}\.\d+)$/i;      // CHEDP.GB.2025.123 / GBCHD2025.123

  // ---- helper: pretty JSON -> <ol> with line numbers + GOV.UK token colours ----
  function renderJsonLinesHTML(obj) {
    if (!obj) return '';
    let s = JSON.stringify(obj, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Keys: "key":
    s = s.replace(/(^\s*)(".*?")(\s*:\s)/gm, (_, indent, key, colon) =>
      `${indent}<span class="json-key">${key}</span>${colon}`
    );

    // Strings (values): : "text"
    s = s.replace(/:\s(".*?")/g, ': <span class="json-string">$1</span>');

    // Numbers (integers, floats, scientific)
    s = s.replace(/:\s(-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?)/gi, ': <span class="json-number">$1</span>');

    // Booleans
    s = s.replace(/:\s(true|false)/g, ': <span class="json-boolean">$1</span>');

    // Nulls
    s = s.replace(/:\s(null)/g, ': <span class="json-null">$1</span>');

    const lis = s.split('\n').map(line => `<li><code>${line || ' '}</code></li>`).join('');
    return `<ol class="codeblock">${lis}</ol>`;
  }

  // ---- Helper: Format MRN data for timeline ----
  function formatMrnForTimeline(mrnData) {
    if (!mrnData) return [];
    
    const timeline = [];
    
    // 1. Clearance Request
    if (mrnData.clearanceRequest) {
      const cr = mrnData.clearanceRequest;
      
      // Build commodities HTML
      let commoditiesHtml = '';
      if (cr.commodities && cr.commodities.length > 0) {
        commoditiesHtml = cr.commodities.map((item, idx) => {
          const docs = item.documents?.map(d => 
            `<li><strong>${d.documentCode}</strong>: ${d.documentReference} (${d.documentStatus})</li>`
          ).join('') || '<li>None</li>';
          
          const checks = item.checks?.map(c => 
            `<li><strong>${c.checkCode}</strong> - ${c.departmentCode}</li>`
          ).join('') || '<li>None</li>';
          
          return `
            <div class="govuk-!-margin-bottom-4" style="padding: 15px; background: #f8f8f8; border-left: 3px solid #b1b4b6;">
              <h4 class="govuk-heading-s govuk-!-margin-bottom-2">Item ${item.itemNumber}</h4>
              <dl class="govuk-summary-list govuk-summary-list--no-border">
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Commodity Code</dt>
                  <dd class="govuk-summary-list__value">${item.taricCommodityCode}</dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Description</dt>
                  <dd class="govuk-summary-list__value">${item.goodsDescription}</dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Net Mass</dt>
                  <dd class="govuk-summary-list__value">${item.netMass}kg</dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Origin</dt>
                  <dd class="govuk-summary-list__value">${item.originCountryCode}</dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Procedure Code</dt>
                  <dd class="govuk-summary-list__value">${item.customsProcedureCode}</dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Consignee</dt>
                  <dd class="govuk-summary-list__value">${item.consigneeName}</dd>
                </div>
              </dl>
              <p class="govuk-body-s govuk-!-font-weight-bold govuk-!-margin-bottom-1">Documents:</p>
              <ul class="govuk-list govuk-list--bullet">${docs}</ul>
              <p class="govuk-body-s govuk-!-font-weight-bold govuk-!-margin-bottom-1">Checks Required:</p>
              <ul class="govuk-list govuk-list--bullet">${checks}</ul>
            </div>
          `;
        }).join('');
      }
      
      timeline.push({
        label: { text: 'Declaration submitted to CDS' },
        html: `
          <p class="govuk-body">Customs declaration created with ${cr.commodities?.length || 0} commodity item(s).</p>
          <dl class="govuk-summary-list govuk-summary-list--no-border">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">DUCR</dt>
              <dd class="govuk-summary-list__value">${cr.declarationUcr || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Declaration Type</dt>
              <dd class="govuk-summary-list__value">${cr.declarationType || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Declarant</dt>
              <dd class="govuk-summary-list__value">${cr.declarantId || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Dispatch Country</dt>
              <dd class="govuk-summary-list__value">${cr.dispatchCountryCode || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Goods Location</dt>
              <dd class="govuk-summary-list__value">${cr.goodsLocationCode || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Master UCR</dt>
              <dd class="govuk-summary-list__value">${cr.masterUcr || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Correlation ID</dt>
              <dd class="govuk-summary-list__value">${cr.externalCorrelationId || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Version</dt>
              <dd class="govuk-summary-list__value">${cr.externalVersion || 'N/A'}</dd>
            </div>
          </dl>
          
          ${commoditiesHtml ? `
          <details class="govuk-details govuk-!-margin-top-3" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View commodity details (${cr.commodities?.length || 0} item(s))
              </span>
            </summary>
            <div class="govuk-details__text">
              ${commoditiesHtml}
            </div>
          </details>
          ` : ''}
        `,
        datetime: {
          timestamp: cr.messageSentAt || new Date().toISOString(),
          type: 'datetime'
        },
        byline: { text: 'Trader via CDS' }
      });
    }
    
    // 2. Clearance Decision
    if (mrnData.clearanceDecision) {
      const cd = mrnData.clearanceDecision;
      const result = cd.results?.[0];
      const decisionCode = result?.decisionCode;
      
      let label = 'Decision issued';
      let tagClass = 'govuk-tag--blue';
      let tagText = decisionCode || 'Unknown';
      
      if (decisionCode === 'H01') {
        label = 'Hold decision issued';
        tagClass = 'govuk-tag--red';
        tagText = 'H01 - Hold';
      } else if (decisionCode === 'C03') {
        label = 'Release decision issued';
        tagClass = 'govuk-tag--green';
        tagText = 'C03 - Release';
      }
      
      // Build decision items HTML
      let itemsHtml = '';
      if (cd.items && cd.items.length > 0) {
        itemsHtml = cd.items.map((item, idx) => {
          const checksHtml = item.checks?.map(c => {
            let checkTagClass = 'govuk-tag--blue';
            let checkDecisionText = c.decisionCode || 'N/A';
            
            if (c.decisionCode === 'H01') {
              checkTagClass = 'govuk-tag--red';
              checkDecisionText = 'H01 - Hold';
            } else if (c.decisionCode === 'C03') {
              checkTagClass = 'govuk-tag--green';
              checkDecisionText = 'C03 - Release';
            }
            
            return `
              <li>
                <strong>${c.checkCode}</strong> 
                <strong class="govuk-tag ${checkTagClass}">${checkDecisionText}</strong>
                ${c.decisionReasons && c.decisionReasons.length > 0 ? `
                  <p class="govuk-body-s govuk-!-margin-top-1">Reasons:</p>
                  <ul class="govuk-list govuk-list--bullet">
                    ${c.decisionReasons.map(r => `<li>${r}</li>`).join('')}
                  </ul>
                ` : ''}
              </li>
            `;
          }).join('') || '<li>No checks</li>';
          
          return `
            <div class="govuk-!-margin-bottom-3" style="padding: 15px; background: #f8f8f8; border-left: 3px solid #b1b4b6;">
              <h4 class="govuk-heading-s govuk-!-margin-bottom-2">Item ${item.itemNumber}</h4>
              <p class="govuk-body-s govuk-!-font-weight-bold govuk-!-margin-bottom-1">Check decisions:</p>
              <ul class="govuk-list govuk-list--bullet">${checksHtml}</ul>
            </div>
          `;
        }).join('');
      }
      
      timeline.push({
        label: { text: label },
        html: `
          <p class="govuk-body">
            <strong class="govuk-tag ${tagClass}">${tagText}</strong>
          </p>
          <dl class="govuk-summary-list govuk-summary-list--no-border">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Decision Number</dt>
              <dd class="govuk-summary-list__value">${cd.decisionNumber || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">CHED Reference</dt>
              <dd class="govuk-summary-list__value">${result?.importPreNotification || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Check Code</dt>
              <dd class="govuk-summary-list__value">${result?.checkCode || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Decision Valid From</dt>
              <dd class="govuk-summary-list__value">${result?.validFrom ? new Date(result.validFrom).toLocaleString('en-GB') : 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Decision Valid Until</dt>
              <dd class="govuk-summary-list__value">${result?.validUntil ? new Date(result.validUntil).toLocaleString('en-GB') : 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Correlation ID</dt>
              <dd class="govuk-summary-list__value">${cd.correlationId || 'N/A'}</dd>
            </div>
          </dl>
          
          ${itemsHtml ? `
          <details class="govuk-details govuk-!-margin-top-3" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View decision items (${cd.items?.length || 0} item(s))
              </span>
            </summary>
            <div class="govuk-details__text">
              ${itemsHtml}
            </div>
          </details>
          ` : ''}
        `,
        datetime: {
          timestamp: cd.created || new Date().toISOString(),
          type: 'datetime'
        },
        byline: { text: 'BTMS Decision Service' }
      });
    }
    
    // 3. Finalisation
    if (mrnData.finalisation) {
      const fin = mrnData.finalisation;
      const finalState = fin.finalState === '0' ? 'Released' : fin.finalState;
      
      timeline.push({
        label: { text: 'Declaration finalised' },
        html: `
          <p class="govuk-body">
            <strong class="govuk-tag govuk-tag--green">${finalState}</strong>
            ${fin.isManualRelease ? '<strong class="govuk-tag govuk-tag--blue">Manual Release</strong>' : ''}
          </p>
          <dl class="govuk-summary-list govuk-summary-list--no-border">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Correlation ID</dt>
              <dd class="govuk-summary-list__value">${fin.externalCorrelationId || 'N/A'}</dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">Message Sent</dt>
              <dd class="govuk-summary-list__value">${fin.messageSentAt ? fin.messageSentAt.replace('T', ' at ').replace('Z', '') : 'N/A'}</dd>
            </div>
          </dl>
        `,
        datetime: {
          timestamp: fin.messageSentAt || new Date().toISOString(),
          type: 'datetime'
        },
        byline: { text: 'HMRC CDS' }
      });
    }
    
    return timeline;
  }

  // ---- Helper: Format messages for timeline ----
  function formatMessagesForTimeline(messages) {
    if (!messages || !Array.isArray(messages)) return [];
    
    // Sort by created date descending (newest first)
    const sorted = [...messages].sort((a, b) => {
      const dateA = new Date(a.created || a.message?.resource?.Created || 0);
      const dateB = new Date(b.created || b.message?.resource?.Created || 0);
      return dateB - dateA;
    });
    
    return sorted.map((msg) => {
      let label = 'Message received';
      let byline = 'System';
      let content = '';
      
      const created = msg.created || msg.message?.resource?.Created || new Date().toISOString();
      const subType = msg.subResourceType;
      const operation = msg.operation;
      
      // Build label
      if (subType === 'ClearanceRequest') {
        label = 'Declaration submitted';
        byline = 'Trader via CDS';
        
        const cr = msg.message?.resource?.ClearanceRequest;
        if (cr) {
          content = `
            <dl class="govuk-summary-list govuk-summary-list--no-border">
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Operation</dt>
                <dd class="govuk-summary-list__value"><strong class="govuk-tag govuk-tag--blue">${operation}</strong></dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">DUCR</dt>
                <dd class="govuk-summary-list__value">${cr.declarationUcr || 'N/A'}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Correlation ID</dt>
                <dd class="govuk-summary-list__value">${cr.externalCorrelationId || 'N/A'}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Commodities</dt>
                <dd class="govuk-summary-list__value">${cr.commodities?.length || 0} item(s)</dd>
              </div>
            </dl>
          `;
        }
      } else if (subType === 'ClearanceDecision') {
        label = 'Decision updated';
        byline = 'BTMS Decision Service';
        
        const cd = msg.message?.resource?.ClearanceDecision;
        if (cd) {
          const result = cd.results?.[0];
          const decisionCode = result?.decisionCode || cd.items?.[0]?.checks?.[0]?.decisionCode;
          
          let tagClass = 'govuk-tag--blue';
          let tagText = decisionCode || 'Unknown';
          
          if (decisionCode === 'H01') {
            tagClass = 'govuk-tag--red';
            tagText = 'H01 - Hold';
          } else if (decisionCode === 'C03') {
            tagClass = 'govuk-tag--green';
            tagText = 'C03 - Release';
          }
          
          content = `
            <p class="govuk-body">
              <strong class="govuk-tag ${tagClass}">${tagText}</strong>
              <strong class="govuk-tag govuk-tag--grey">${operation}</strong>
            </p>
            <dl class="govuk-summary-list govuk-summary-list--no-border">
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Decision Number</dt>
                <dd class="govuk-summary-list__value">${cd.decisionNumber || 'N/A'}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">CHED Reference</dt>
                <dd class="govuk-summary-list__value">${result?.importPreNotification || 'N/A'}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Correlation ID</dt>
                <dd class="govuk-summary-list__value">${cd.correlationId || 'N/A'}</dd>
              </div>
            </dl>
          `;
        }
      } else if (subType === 'Finalisation') {
        label = 'Declaration finalised';
        byline = 'HMRC CDS';
        
        const fin = msg.message?.resource?.Finalisation;
        if (fin) {
          const finalState = fin.finalState === '0' ? 'Released' : fin.finalState;
          content = `
            <p class="govuk-body">
              <strong class="govuk-tag govuk-tag--green">${finalState}</strong>
              ${fin.isManualRelease ? '<strong class="govuk-tag govuk-tag--blue">Manual Release</strong>' : ''}
              <strong class="govuk-tag govuk-tag--grey">${operation}</strong>
            </p>
            <dl class="govuk-summary-list govuk-summary-list--no-border">
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Correlation ID</dt>
                <dd class="govuk-summary-list__value">${fin.externalCorrelationId || 'N/A'}</dd>
              </div>
            </dl>
          `;
        }
      }
      
      return {
        label: { text: label },
        html: content,
        datetime: {
          timestamp: created,
          type: 'datetime'
        },
        byline: { text: byline }
      };
    });
  }

  // ---- Demo payloads (swap for real lookup later) ----

  // MRN demo
  const MRN_INFO = {
    movementReferenceNumber: KNOWN_MRN,
    clearanceRequest: {
      externalCorrelationId: '2304293',
      messageSentAt: '2025-10-09T14:30:07Z',
      externalVersion: 1,
      previousExternalVersion: null,
      declarationUcr: '5GB938581482000-LHR81328A',
      declarationPartNumber: null,
      declarationType: 'S',
      arrivesAt: null,
      submitterTurn: null,
      declarantId: 'GB938581482000',
      declarantName: 'GB938581482000',
      dispatchCountryCode: 'ZA',
      goodsLocationCode: 'LHRLHRLHR',
      masterUcr: 'HEUB12517104986',
      commodities: [
        {
          itemNumber: 1,
          customsProcedureCode: '4000F15',
          taricCommodityCode: '3507909090',
          goodsDescription: 'ALBUMINOIDAL SUBSTANCES, MODIFIED STARCHES, GLUES, ENZYMES',
          consigneeId: 'GB625129846000',
          consigneeName: 'GB625129846000',
          netMass: 0.919,
          supplementaryUnits: 0,
          thirdQuantity: null,
          originCountryCode: 'ZA',
          documents: [
            {
              documentCode: 'N853',
              documentReference: 'GBCHD2025.6679908',
              documentStatus: 'AE',
              documentControl: 'P',
              documentQuantity: null
            }
          ],
          checks: [
            {
              checkCode: 'H222',
              departmentCode: 'PHA'
            }
          ]
        }
      ]
    },
    clearanceDecision: {
      correlationId: '17606157935057674797',
      created: '2025-10-16T11:56:33.505Z',
      externalVersionNumber: 1,
      decisionNumber: 2,
      sourceVersion: null,
      items: [
        {
          itemNumber: 1,
          checks: [
            {
              checkCode: 'H222',
              decisionCode: 'C03',
              decisionsValidUntil: null,
              decisionReasons: [],
              decisionInternalFurtherDetail: null
            }
          ]
        }
      ],
      results: [
        {
          itemNumber: 1,
          importPreNotification: 'CHEDP.GB.2025.6679908',
          documentReference: 'GBCHD2025.6679908',
          documentCode: 'N853',
          checkCode: 'H222',
          decisionCode: 'C03',
          decisionReason: null,
          internalDecisionCode: null
        }
      ]
    },
    finalisation: {
      externalCorrelationId: '2329058',
      messageSentAt: '2025-10-16T12:08:10Z',
      externalVersion: 1,
      decisionNumber: null,
      finalState: '0',
      isManualRelease: true
    },
    externalErrors: null,
    created: '2025-10-09T14:30:07.968Z',
    updated: '2025-10-16T12:08:10.682Z'
  };

  const MRN_MESSAGES = [
    {
      id: "68e7c6ef2a7f01cd2569a487",
      etag: "68e7c6ef2a7f01cd2569a489",
      created: "2025-10-09T14:30:07.97Z",
      updated: "2025-10-09T14:30:07.988Z",
      resourceId: KNOWN_MRN,
      resourceType: "CustomsDeclaration",
      subResourceType: "ClearanceRequest",
      operation: "Created",
      message: {
        resourceId: KNOWN_MRN,
        resourceType: "CustomsDeclaration",
        subResourceType: "ClearanceRequest",
        operation: "Created",
        resource: {
          Id: KNOWN_MRN,
          ImportPreNotificationIdentifiers: ["6679908"],
          ETag: "68e7c6ef2a7f01cd2569a484",
          Created: "2025-10-09T14:30:07.9681364Z",
          Updated: "2025-10-09T14:30:07.9681364Z",
          ClearanceRequest: {
            externalCorrelationId: "2304293",
            messageSentAt: "2025-10-09T14:30:07Z",
            externalVersion: 1,
            previousExternalVersion: null,
            declarationUcr: "5GB938581482000-LHR81328A",
            declarationPartNumber: null,
            declarationType: "S",
            arrivesAt: null,
            submitterTurn: null,
            declarantId: "GB938581482000",
            declarantName: "GB938581482000",
            dispatchCountryCode: "ZA",
            goodsLocationCode: "LHRLHRLHR",
            masterUcr: "HEUB12517104986",
            commodities: [
              {
                itemNumber: 1,
                customsProcedureCode: "4000F15",
                taricCommodityCode: "3507909090",
                goodsDescription: "ALBUMINOIDAL SUBSTANCES, MODIFIED STARCHES, GLUES, ENZYMES",
                consigneeId: "GB625129846000",
                consigneeName: "GB625129846000",
                netMass: 0.919,
                supplementaryUnits: 0,
                thirdQuantity: null,
                originCountryCode: "ZA",
                documents: [
                  {
                    documentCode: "N853",
                    documentReference: "GBCHD2025.6679908",
                    documentStatus: "AE",
                    documentControl: "P",
                    documentQuantity: null
                  }
                ],
                checks: [
                  {
                    checkCode: "H222",
                    departmentCode: "PHA"
                  }
                ]
              }
            ]
          },
          ClearanceDecision: null,
          Finalisation: null,
          ExternalErrors: null
        },
        etag: "68e7c6ef2a7f01cd2569a484",
        timestamp: "2025-10-09T14:30:07.9706171Z",
        changeSet: []
      },
      published: "2025-10-09T14:30:07.988Z",
      expiresAt: "2026-04-07T14:30:07.97Z"
    },
    {
      id: "68e7c6f0f9216c442be48b68",
      etag: "68e7c6f0f9216c442be48b6a",
      created: "2025-10-09T14:30:08.138Z",
      updated: "2025-10-09T14:30:08.157Z",
      resourceId: KNOWN_MRN,
      resourceType: "CustomsDeclaration",
      subResourceType: "ClearanceDecision",
      operation: "Updated",
      message: {
        resourceId: KNOWN_MRN,
        resourceType: "CustomsDeclaration",
        subResourceType: "ClearanceDecision",
        operation: "Updated",
        resource: {
          Id: KNOWN_MRN,
          ImportPreNotificationIdentifiers: ["6679908"],
          ETag: "68e7c6f0f9216c442be48b65",
          Created: "2025-10-09T14:30:07.968Z",
          Updated: "2025-10-09T14:30:08.1368974Z",
          ClearanceRequest: { /* can inline MRN_INFO.clearanceRequest if desired */ },
          ClearanceDecision: {
            correlationId: "17600202081175195741",
            created: "2025-10-09T14:30:08.1171972Z",
            externalVersionNumber: 1,
            decisionNumber: 1,
            items: [
              {
                itemNumber: 1,
                checks: [
                  {
                    checkCode: "H222",
                    decisionCode: "H01",
                    decisionsValidUntil: null,
                    decisionReasons: [],
                    decisionInternalFurtherDetail: null
                  }
                ]
              }
            ],
            results: [
              {
                itemNumber: 1,
                importPreNotification: "CHEDP.GB.2025.6679908",
                documentReference: "GBCHD2025.6679908",
                documentCode: "N853",
                checkCode: "H222",
                decisionCode: "H01",
                decisionReason: null,
                internalDecisionCode: null
              }
            ]
          },
          Finalisation: null,
          ExternalErrors: null
        },
        etag: "68e7c6f0f9216c442be48b65",
        timestamp: "2025-10-09T14:30:08.1386394Z",
        changeSet: [
          {
            path: "/ClearanceDecision",
            operation: "Replace",
            value: {
              correlationId: "17600202081175195741",
              created: "2025-10-09T14:30:08.1171972Z",
              externalVersionNumber: 1,
              decisionNumber: 1,
              items: [/* … */],
              results: [/* … */]
            }
          }
        ]
      },
      published: "2025-10-09T14:30:08.157Z",
      expiresAt: "2026-04-07T14:30:08.138Z"
    },
    {
      id: "68f0dd712a7f01cd256e474d",
      etag: "68f0dd712a7f01cd256e474f",
      created: "2025-10-16T11:56:33.518Z",
      updated: "2025-10-16T11:56:33.554Z",
      resourceId: KNOWN_MRN,
      resourceType: "CustomsDeclaration",
      subResourceType: "ClearanceDecision",
      operation: "Updated",
      message: {
        resource: {
          Id: KNOWN_MRN,
          ClearanceDecision: {
            correlationId: "17606157935057674797",
            created: "2025-10-16T11:56:33.5056909Z",
            decisionNumber: 2,
            items: [
              {
                itemNumber: 1,
                checks: [
                  {
                    checkCode: "H222",
                    decisionCode: "C03"
                  }
                ]
              }
            ],
            results: [
              {
                itemNumber: 1,
                importPreNotification: "CHEDP.GB.2025.6679908",
                documentReference: "GBCHD2025.6679908",
                decisionCode: "C03"
              }
            ]
          }
        },
        timestamp: "2025-10-16T11:56:33.5184795Z"
      },
      published: "2025-10-16T11:56:33.554Z"
    },
    {
      id: "68f0e02a9f17581482a8d529",
      etag: "68f0e02a9f17581482a8d52b",
      created: "2025-10-16T12:08:10.684Z",
      updated: "2025-10-16T12:08:10.73Z",
      resourceId: KNOWN_MRN,
      resourceType: "CustomsDeclaration",
      subResourceType: "Finalisation",
      operation: "Updated",
      message: {
        resource: {
          Id: KNOWN_MRN,
          ClearanceDecision: {
            correlationId: "17606157935057674797",
            decisionNumber: 2,
            results: [
              {
                itemNumber: 1,
                decisionCode: "C03"
              }
            ]
          },
          Finalisation: {
            externalCorrelationId: "2329058",
            messageSentAt: "2025-10-16T12:08:10Z",
            externalVersion: 1,
            finalState: "0",
            isManualRelease: true
          }
        },
        timestamp: "2025-10-16T12:08:10.6840891Z"
      },
      published: "2025-10-16T12:08:10.73Z"
    }
  ];


  // CHED demo (now includes full importPreNotification)
  const CHED_INFO = {
    checkCode: 'H222',
    documentCode: 'N853',
    documentReference: 'GBCHD2025.6679908',
    status: 'AE',
    decision: 'C03',
    relatedMRN: KNOWN_MRN,
    created: '2025-10-09T14:30:07.968Z',
    updated: '2025-10-16T12:08:10.682Z',
    importPreNotification: {
      ipaffsId: 5724888,
      etag: '00000000067E7DC2',
      externalReferences: null,
      referenceNumber: 'CHEDP.GB.2025.6679908',
      version: 8,
      updatedSource: '2025-10-16T11:56:33.255Z',
      lastUpdatedBy: {
        displayName: 'Anna Roszkowiak',
        userId: '9582825b-ced2-ec11-a7b5-0022487ed6f9',
        isControlUser: null
      },
      importNotificationType: 'CVEDP',
      replaces: null,
      replacedBy: null,
      status: 'VALIDATED',
      splitConsignment: null,
      childNotification: null,
      riskAssessment: {
        commodityResults: [
          {
            riskDecision: 'NOTREQUIRED',
            exitRiskDecision: null,
            hmiDecision: null,
            phsiDecision: null,
            phsiClassification: null,
            phsi: null,
            uniqueId: '23d2dd6d-6255-42c4-9db0-14e2186f2a85',
            eppoCode: null,
            variety: null,
            isWoody: null,
            indoorOutdoor: null,
            propagation: null,
            phsiRuleType: null
          }
        ],
        assessedOn: '2025-10-09T14:02:56'
      },
      journeyRiskCategorisation: {
        riskLevel: 'Medium',
        riskLevelMethod: 'User',
        riskLevelSetFor: '2025-10-09T12:53:32'
      },
      isHighRiskEuImport: false,
      partOne: {
        typeOfImp: null,
        personResponsible: {
          id: null,
          name: 'Jakub Marczak',
          companyId: '9d3205a9-3844-eb11-a812-000d3a267bf8',
          contactId: '8e3205a9-3844-eb11-a812-000d3a267bf8',
          companyName: 'Redacted Data',
          addresses: ['Redacted Data'],
          county: null,
          postCode: null,
          country: 'Redacted Data',
          city: null,
          tracesId: 1001,
          type: null,
          approvalNumber: null,
          phone: 'Redacted Data',
          fax: null,
          email: 'Redacted Data'
        },
        customsReferenceNumber: null,
        containsWoodPackaging: null,
        consignmentArrived: null,
        consignor: {
          id: '7316d52c-c2e9-4c94-9dc6-8b67d02367a1',
          type: 'exporter',
          status: 'nonapproved',
          companyName: 'Redacted Data',
          individualName: null,
          address: {
            street: null,
            city: 'Redacted Data',
            country: null,
            postalCode: null,
            addressLine1: 'Redacted Data',
            addressLine2: 'Redacted Data',
            addressLine3: 'Redacted Data',
            postalZipCode: 'Redacted Data',
            countryIsoCode: 'Redacted Data',
            email: 'lRedacted Data',
            ukTelephone: null,
            telephone: 'Redacted Data',
            internationalTelephone: null
          },
          approvalNumber: null,
          otherIdentifier: null,
          tracesId: 10003723
        },
        consignorTwo: null,
        packer: null,
        consignee: {
          id: '6d53375b-1593-47a8-b44a-68be343a724d',
          type: 'consignee',
          status: 'nonapproved',
          companyName: 'Redacted Data',
          individualName: null,
          address: {
            street: null,
            city: 'Redacted Data',
            country: null,
            postalCode: null,
            addressLine1: 'Redacted Data',
            addressLine2: 'Redacted Data',
            addressLine3: null,
            postalZipCode: 'Redacted Data',
            countryIsoCode: 'GB',
            email: 'Redacted Data',
            ukTelephone: null,
            telephone: 'Redacted Data',
            internationalTelephone: null
          },
          approvalNumber: null,
          otherIdentifier: null,
          tracesId: 10003724
        },
        importer: {
          id: '6d53375b-1593-47a8-b44a-68be343a724d',
          type: 'consignee',
          status: 'nonapproved',
          companyName: 'Redacted Data',
          individualName: null,
          address: {
            street: null,
            city: 'Redacted Data',
            country: null,
            postalCode: null,
            addressLine1: 'Redacted Data',
            addressLine2: 'Redacted Data',
            addressLine3: null,
            postalZipCode: 'Redacted Data',
            countryIsoCode: 'GB',
            email: 'Redacted Data',
            ukTelephone: null,
            telephone: 'Redacted Data',
            internationalTelephone: null
          },
          approvalNumber: null,
          otherIdentifier: null,
          tracesId: 10003724
        },
        placeOfDestination: {
          id: '6d53375b-1593-47a8-b44a-68be343a724d',
          type: 'consignee',
          status: 'nonapproved',
          companyName: 'Redacted Data',
          individualName: null,
          address: {
            street: null,
            city: 'Redacted Data',
            country: null,
            postalCode: null,
            addressLine1: 'Redacted Data',
            addressLine2: 'Redacted Data',
            addressLine3: null,
            postalZipCode: 'Redacted Data',
            countryIsoCode: 'GB',
            email: 'Redacted Data',
            ukTelephone: null,
            telephone: 'Redacted Data',
            internationalTelephone: null
          },
          approvalNumber: null,
          otherIdentifier: null,
          tracesId: 10003724
        },
        pod: null,
        placeOfOriginHarvest: null,
        additionalPermanentAddresses: null,
        cphNumber: null,
        importingFromCharity: null,
        isPlaceOfDestinationThePermanentAddress: null,
        isCatchCertificateRequired: null,
        isGvmsRoute: false,
        commodities: {
          gmsDeclarationAccepted: null,
          consignedCountryInChargeGroup: null,
          totalGrossWeight: 67,
          totalNetWeight: 0.919,
          totalGrossVolume: null,
          totalGrossVolumeUnit: null,
          numberOfPackages: 3,
          temperature: 'Frozen',
          numberOfAnimals: null,
          includeNonAblactedAnimals: false,
          countryOfOrigin: 'ZA',
          countryOfOriginIsPodCountry: null,
          isLowRiskArticle72Country: false,
          regionOfOrigin: null,
          consignedCountry: 'ZA',
          animalsCertifiedAs: null,
          commodityIntendedFor: null,
          commodityComplements: [
            {
              uniqueComplementId: null,
              commodityDescription: 'Other',
              commodityId: '35079090',
              complementId: 35079090,
              complementName: null,
              eppoCode: null,
              isWoodPackaging: null,
              speciesId: null,
              speciesName: null,
              speciesNomination: null,
              speciesTypeName: null,
              speciesType: '35079090',
              speciesClassName: null,
              speciesClass: '35079090',
              speciesFamilyName: null,
              speciesFamily: null,
              speciesCommonName: null,
              isCdsMatched: true
            }
          ],
          complementParameterSets: [
            {
              uniqueComplementId: '23d2dd6d-6255-42c4-9db0-14e2186f2a85',
              complementId: 35079090,
              speciesId: null,
              keyDataPair: [
                { key: 'netweight', data: '0.919' },
                { key: 'number_package', data: '3' },
                { key: 'type_package', data: 'Carton' }
              ],
              catchCertificates: null,
              identifiers: null
            }
          ]
        },
        purpose: {
          conformsToEU: true,
          internalMarketPurpose: 'Technical Use',
          thirdCountryTranshipment: null,
          forNonConforming: null,
          regNumber: null,
          shipName: null,
          shipPort: null,
          exitBip: null,
          thirdCountry: null,
          transitThirdCountries: null,
          forImportOrAdmission: null,
          exitDate: null,
          finalBip: null,
          pointOfExit: null,
          purposeGroup: 'For Import',
          estimatedArrivesAtPortOfExit: null
        },
        pointOfEntry: 'GBLHR4P',
        pointOfEntryControlPoint: null,
        meansOfTransport: {
          type: 'Road Vehicle',
          document: 'Redacted Data',
          id: 'Redacted Data'
        },
        transporter: {
          id: 'd30bc6d4-6129-49b8-b2bf-c9235d0c8c35',
          type: 'private transporter',
          status: 'nonapproved',
          companyName: 'Redacted Data',
          individualName: null,
          address: {
            street: null,
            city: 'Redacted Data',
            country: null,
            postalCode: null,
            addressLine1: 'Redacted Data',
            addressLine2: 'Redacted Data',
            addressLine3: null,
            postalZipCode: 'Redacted Data',
            countryIsoCode: 'GB',
            email: 'Redacted Data',
            ukTelephone: null,
            telephone: 'Redacted Data',
            internationalTelephone: null
          },
          approvalNumber: null,
          otherIdentifier: null,
          tracesId: 10003725
        },
        transporterDetailsRequired: true,
        meansOfTransportFromEntryPoint: {
          type: 'Aeroplane',
          document: '125-17104986',
          id: 'BA058/07'
        },
        estimatedJourneyTimeInMinutes: null,
        responsibleForTransport: null,
        veterinaryInformation: {
          establishmentsOfOriginExternalReference: null,
          establishmentsOfOrigins: [
            {
              id: '1c1982ef-8cd2-3455-7f70-bb6a3a5cb15d',
              name: 'BBI Enzymes (Pty) Ltd',
              country: 'ZA',
              types: ['Category 3', 'Category 2'],
              approvalNumber: 'ZA 28/125',
              section: 'Plants or establishments manufacturing intermediate products'
            }
          ],
          veterinaryDocument: null,
          veterinaryDocumentIssuedOn: null,
          accompanyingDocumentNumbers: null,
          accompanyingDocuments: [
            {
              documentType: 'commercialInvoice',
              documentReference: 'SO-S10525-001373',
              documentIssuedOn: '2025-09-26',
              attachmentId: '43eff3ed-6afa-4218-8eb3-b9575f00d5f3',
              attachmentFilename: 'Shipping docs S2075H39 .pdf',
              attachmentContentType: 'application/pdf',
              uploadUserId: '8e3205a9-3844-eb11-a812-000d3a267bf8',
              uploadOrganisationId: '9d3205a9-3844-eb11-a812-000d3a267bf8',
              externalReference: null
            },
            {
              documentType: 'airWaybill',
              documentReference: '125-17104986',
              documentIssuedOn: '2025-10-06',
              attachmentId: '15428666-48bd-424e-a285-035cb673b5d4',
              attachmentFilename: 'HAWB_LR_JAE5053 (2).pdf',
              attachmentContentType: 'application/pdf',
              uploadUserId: '8e3205a9-3844-eb11-a812-000d3a267bf8',
              uploadOrganisationId: '9d3205a9-3844-eb11-a812-000d3a267bf8',
              externalReference: null
            },
            {
              documentType: 'other',
              documentReference: '5000158207-10',
              documentIssuedOn: '2025-10-10',
              attachmentId: '233402bf-f596-45a6-8acb-2637ec324d6e',
              attachmentFilename: 'CHEDP.GB.2025.6679908-c.pdf',
              attachmentContentType: 'application/pdf',
              uploadUserId: '8e3205a9-3844-eb11-a812-000d3a267bf8',
              uploadOrganisationId: '9d3205a9-3844-eb11-a812-000d3a267bf8',
              externalReference: null
            },
            {
              documentType: 'latestVeterinaryHealthCertificate',
              documentReference: '5000158207-10',
              documentIssuedOn: '2025-10-10',
              attachmentId: null,
              attachmentFilename: null,
              attachmentContentType: null,
              uploadUserId: null,
              uploadOrganisationId: null,
              externalReference: null
            }
          ],
          catchCertificateAttachments: null,
          identificationDetails: null
        },
        importerLocalReferenceNumber: null,
        route: null,
        sealsContainers: null,
        storeTransporterContact: null,
        submittedOn: '2025-10-16T11:52:34.654Z',
        submittedBy: {
          displayName: 'Redacted Data',
          userId: '8e3205a9-3844-eb11-a812-000d3a267bf8',
          isControlUser: null
        },
        consignmentValidations: null,
        complexCommoditySelected: true,
        portOfEntry: 'GBLHRE',
        portOfExit: null,
        exitedPortOfOn: null,
        contactDetails: {
          name: 'Redacted Data',
          telephone: 'Redacted Data',
          email: 'Redacted Data',
          agent: null
        },
        nominatedContacts: [
          {
            name: 'Redacted Data',
            email: 'Redacted Data',
            telephone: 'Redacted Data'
          }
        ],
        originalEstimatedOn: null,
        billingInformation: null,
        isChargeable: null,
        wasChargeable: null,
        commonUserCharge: null,
        provideCtcMrn: 'NO',
        arrivesAt: '2025-10-08T04:59:00',
        departedOn: '2025-10-07T17:00:00'
      },
      decisionBy: {
        displayName: 'Redacted Data',
        userId: '9582825b-ced2-ec11-a7b5-0022487ed6f9',
        isControlUser: null
      },
      decisionDate: '2025-10-16T11:56:33.227419486Z',
      partTwo: {
        decision: {
          consignmentAcceptable: true,
          notAcceptableAction: null,
          notAcceptableActionDestructionReason: null,
          notAcceptableActionEntryRefusalReason: null,
          notAcceptableActionQuarantineImposedReason: null,
          notAcceptableActionSpecialTreatmentReason: null,
          notAcceptableActionIndustrialProcessingReason: null,
          notAcceptableActionReDispatchReason: null,
          notAcceptableActionUseForOtherPurposesReason: null,
          notAcceptableDestructionReason: null,
          notAcceptableActionOtherReason: null,
          notAcceptableActionByDate: null,
          chedppNotAcceptableReasons: null,
          notAcceptableReasons: null,
          notAcceptableCountry: null,
          notAcceptableEstablishment: null,
          notAcceptableOtherReason: null,
          detailsOfControlledDestinations: null,
          specificWarehouseNonConformingConsignment: null,
          temporaryDeadline: null,
          decision: 'Acceptable for Internal Market',
          freeCirculationPurpose: 'Technical Use',
          definitiveImportPurpose: null,
          ifChanneledOption: null,
          customWarehouseRegisteredNumber: null,
          freeWarehouseRegisteredNumber: null,
          shipName: null,
          shipPortOfExit: null,
          shipSupplierRegisteredNumber: null,
          transhipmentBip: null,
          transhipmentThirdCountry: null,
          transitExitBip: null,
          transitThirdCountry: null,
          transitDestinationThirdCountry: null,
          temporaryExitBip: null,
          horseReentry: null,
          transhipmentEuOrThirdCountry: null
        },
        consignmentCheck: {
          euStandard: null,
          additionalGuarantees: null,
          documentCheckAdditionalDetails: null,
          documentCheckResult: 'Satisfactory',
          nationalRequirements: null,
          identityCheckDone: null,
          identityCheckType: 'Not Done',
          identityCheckResult: 'Not Done',
          identityCheckNotDoneReason: 'Reduced checks regime',
          physicalCheckDone: null,
          physicalCheckResult: 'Not Done',
          physicalCheckNotDoneReason: 'Reduced checks regime',
          physicalCheckOtherText: null,
          welfareCheck: null,
          numberOfAnimalsChecked: null,
          laboratoryCheckDone: null,
          laboratoryCheckResult: null
        },
        impactOfTransportOnAnimals: null,
        laboratoryTestsRequired: false,
        laboratoryTests: null,
        resealedContainersIncluded: false,
        resealedContainers: null,
        resealedContainersMappings: null,
        controlAuthority: {
          officialVeterinarian: {
            firstName: 'Redacted Data',
            lastName: 'Redacted Data',
            email: 'Redacted Data',
            phone: 'Redacted Data',
            fax: null,
            signed: '2025-10-16T11:56:33.240904566'
          },
          customsReferenceNo: null,
          containerResealed: null,
          newSealNumber: null,
          iuuFishingReference: null,
          iuuCheckRequired: null,
          iuuOption: null
        },
        controlledDestination: null,
        bipLocalReferenceNumber: 'HH/25/41/133',
        signedOnBehalfOf: null,
        onwardTransportation: null,
        consignmentValidations: null,
        checkedOn: '2025-10-16T12:56:00Z',
        accompanyingDocuments: null,
        commodityChecks: null,
        phsiAutoCleared: null,
        hmiAutoCleared: null,
        inspectionRequired: 'Not required',
        inspectionOverride: null,
        autoClearedOn: null
      },
      partThree: {
        controlStatus: null,
        control: null,
        consignmentValidations: null,
        sealCheckRequired: false,
        sealCheck: null,
        sealCheckOverride: null
      },
      officialVeterinarian: null,
      consignmentValidations: null,
      agencyOrganisationId: null,
      riskDecisionLockedOn: '2025-10-08T01:59:00Z',
      isRiskDecisionLocked: true,
      isAutoClearanceExempted: true,
      isBulkUploadInProgress: null,
      requestId: null,
      isCdsFullMatched: true,
      chedTypeVersion: 1,
      isGMRMatched: null,
      created: '2025-10-06T14:58:47.082Z',
      updated: '2025-10-16T11:56:33.387Z'
    }
  };

  const CHED_MESSAGES = [
    {
      resourceType: 'SanitaryPhytosanitary',
      subResourceType: 'ClearanceRequest',
      operation: 'Created',
      timestamp: '2025-10-09T14:30:07.968Z',
      published: '2025-10-09T14:30:07.988Z',
      message: { documentCode: 'N853', documentReference: 'GBCHD2025.6679908', checkCode: 'H222' }
    },
    {
      resourceType: 'SanitaryPhytosanitary',
      subResourceType: 'ClearanceDecision',
      operation: 'Updated',
      timestamp: '2025-10-16T11:56:33.576Z',
      published: '2025-10-16T11:56:33.585Z',
      message: { decisionCode: 'C03' }
    }
  ];

  // Ensure session
  router.use((req, res, next) => {
    req.session.data = req.session.data || {};
    next();
  });

  // GET: empty page
  router.get('/mvp/v6/admin/view', (req, res) => {
    const search = (req.query.searchTerm || '').trim().toUpperCase();
    
    if (!search) {
      return res.render('mvp/v6/admin/view', {
        data: { searchTerm: '' },
        hasResults: false
      });
    }

    // --- MRN path ---
    if (mrnPattern.test(search)) {
      if (search !== KNOWN_MRN) {
        return res.render('mvp/v6/admin/view', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      const mrnHtml = renderJsonLinesHTML(MRN_INFO);
      const messagesHtml = renderJsonLinesHTML({ posts: MRN_MESSAGES });

      return res.render('mvp/v6/admin/view', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'MRN information',
        mrnHtml,
        messagesHtml
      });
    }

    // --- CHED path ---
    if (chedPattern.test(search)) {
      if (!KNOWN_CHEDS.includes(search)) {
        return res.render('mvp/v6/admin/view', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      const chedHtml = renderJsonLinesHTML(CHED_INFO);
      const messagesHtml = renderJsonLinesHTML({ posts: CHED_MESSAGES });

      return res.render('mvp/v6/admin/view', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'CHED information',
        mrnHtml: chedHtml,
        messagesHtml
      });
    }

    // Fallback: format error
    return res.render('mvp/v6/admin/view', {
      data: { searchTerm: search, error: true, errorMessage: 'Enter an MRN or CHED in the correct format' },
      hasResults: false
    });
  });


  // POST: run search and render
  router.post('/mvp/v6/admin/view', (req, res) => {
    const search = (req.body['data.searchTerm'] || '').trim().toUpperCase();

    if (!search) {
      return res.render('mvp/v6/admin/view', {
        data: { searchTerm: '', error: true, errorMessage: 'Enter an MRN, CHED, GMR or DUCR reference' },
        hasResults: false
      });
    }

    // --- MRN path ---
// --- MRN path ---
if (mrnPattern.test(search)) {
  if (search !== KNOWN_MRN) {
    return res.render('mvp/v6/admin/view', {
      data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
      hasResults: false
    });
  }

  const mrnHtml = renderJsonLinesHTML(MRN_INFO);
  const messagesHtml = renderJsonLinesHTML({ posts: MRN_MESSAGES });

  return res.render('mvp/v6/admin/view', {
    data: { searchTerm: search },
    hasResults: true,
    primaryTabLabel: 'MRN information',
    mrnHtml,
    messagesHtml
  });
}

// --- CHED path ---
if (chedPattern.test(search)) {
  if (!KNOWN_CHEDS.includes(search)) {
    return res.render('mvp/v6/admin/view', {
      data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
      hasResults: false
    });
  }

  const chedHtml = renderJsonLinesHTML(CHED_INFO);
  const messagesHtml = renderJsonLinesHTML({ posts: CHED_MESSAGES });

  return res.render('mvp/v6/admin/view', {
    data: { searchTerm: search },
    hasResults: true,
    primaryTabLabel: 'CHED information',
    mrnHtml: chedHtml,
    messagesHtml
  });
}


    // Fallback: format error (not MRN/CHED shapes)
    return res.render('mvp/v6/admin/view', {
      data: { searchTerm: search, error: true, errorMessage: 'Enter an MRN or CHED in the correct format' },
      hasResults: false
    });
  });

  // ==================== V2 ROUTES (Timeline View) ====================

  // GET: V2 timeline view
  router.get('/mvp/v6/admin/view-v2', (req, res) => {
    const search = (req.query.searchTerm || '').trim().toUpperCase();
    
    if (!search) {
      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: '' },
        hasResults: false
      });
    }

    // --- MRN path ---
    if (mrnPattern.test(search)) {
      if (search !== KNOWN_MRN) {
        return res.render('mvp/v6/admin/view-v2', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      const mrnTimeline = formatMrnForTimeline(MRN_INFO);
      const messagesTimeline = formatMessagesForTimeline(MRN_MESSAGES);

      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'MRN information',
        mrnTimeline,
        messagesTimeline
      });
    }

    // --- CHED path ---
    if (chedPattern.test(search)) {
      if (!KNOWN_CHEDS.includes(search)) {
        return res.render('mvp/v6/admin/view-v2', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      // For CHED, we don't have detailed breakdown data, so just show messages
      const messagesTimeline = formatMessagesForTimeline(CHED_MESSAGES);

      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'CHED information',
        mrnTimeline: [],
        messagesTimeline
      });
    }

    // Fallback: format error
    return res.render('mvp/v6/admin/view-v2', {
      data: { searchTerm: search, error: true, errorMessage: 'Enter an MRN or CHED in the correct format' },
      hasResults: false
    });
  });

  // POST: V2 search and render
  router.post('/mvp/v6/admin/view-v2', (req, res) => {
    const search = (req.body['data.searchTerm'] || '').trim().toUpperCase();

    if (!search) {
      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: '', error: true, errorMessage: 'Enter an MRN, CHED, GMR or DUCR reference' },
        hasResults: false
      });
    }

    // --- MRN path ---
    if (mrnPattern.test(search)) {
      if (search !== KNOWN_MRN) {
        return res.render('mvp/v6/admin/view-v2', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      const mrnTimeline = formatMrnForTimeline(MRN_INFO);
      const messagesTimeline = formatMessagesForTimeline(MRN_MESSAGES);

      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'MRN information',
        mrnTimeline,
        messagesTimeline
      });
    }

    // --- CHED path ---
    if (chedPattern.test(search)) {
      if (!KNOWN_CHEDS.includes(search)) {
        return res.render('mvp/v6/admin/view-v2', {
          data: { searchTerm: search, error: true, errorMessage: `${search} cannot be found` },
          hasResults: false
        });
      }

      // For CHED, we don't have detailed breakdown data, so just show messages
      const messagesTimeline = formatMessagesForTimeline(CHED_MESSAGES);

      return res.render('mvp/v6/admin/view-v2', {
        data: { searchTerm: search },
        hasResults: true,
        primaryTabLabel: 'CHED information',
        mrnTimeline: [],
        messagesTimeline
      });
    }

    // Fallback: format error
    return res.render('mvp/v6/admin/view-v2', {
      data: { searchTerm: search, error: true, errorMessage: 'Enter an MRN or CHED in the correct format' },
      hasResults: false
    });
  });
};
